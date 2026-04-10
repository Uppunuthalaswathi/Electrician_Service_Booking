const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { DEFAULT_LOCATION, resolveLocationDetails } = require("../utils/location");
const { RESET_TOKEN_TTL_MINUTES, sendPasswordResetEmail } = require("../utils/email");
const { validatePasswordStrength } = require("../utils/passwords");

const getRoleLoginError = (role) => {
  if (role === "electrician") {
    return "No electrician account found with these details.";
  }

  if (role === "admin") {
    return "No admin account found with these details.";
  }

  return "Invalid email or password";
};

const getUserRoles = (user) => {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  if (roles.includes("admin")) return roles;
  if (roles.includes("electrician")) return ["electrician"];
  return ["user"];
};

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const clearPasswordResetFields = (user) => {
  user.passwordResetToken = null;
  user.passwordResetExpiresAt = null;
  user.passwordResetUsedAt = new Date();
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, location } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const passwordValidationError = validatePasswordStrength(password);
    if (passwordValidationError) {
      return res.status(400).json({ message: passwordValidationError });
    }

    const normalizedRole = role === "electrician" ? "electrician" : "user";
    const resolvedLocation = await resolveLocationDetails({
      mode: req.body.locationMode,
      lat: location?.lat ?? req.body.lat,
      lng: location?.lng ?? req.body.lng,
      area: req.body.area,
      city: req.body.city,
      pincode: req.body.pincode,
      address: req.body.address,
    });

    const locationPayload = resolvedLocation.hasCoordinates
      ? resolvedLocation.coordinates
      : location || null;

    const locationMetaPayload = {
      area: resolvedLocation.area || "",
      city: resolvedLocation.city || "",
      pincode: resolvedLocation.pincode || "",
      addressLabel: resolvedLocation.addressLabel || "",
      source: resolvedLocation.mode || "manual",
      resolvedBy: resolvedLocation.resolvedBy || "",
      lastUpdatedAt: new Date(),
    };

    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      if (!user.roles.includes(normalizedRole)) {
        user.roles.push(normalizedRole);
      }

      user.name = name || user.name;
      user.phone = phone || user.phone;
      user.location = locationPayload || user.location || DEFAULT_LOCATION;
      user.locationMeta = {
        ...(user.locationMeta || {}),
        ...locationMetaPayload,
      };
      await user.save();

      return res.status(200).json({
        message: `${normalizedRole} role added successfully`,
        userId: user._id,
        roles: user.roles,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      roles: [normalizedRole],
      phone: phone || "",
      location: locationPayload || DEFAULT_LOCATION,
      locationMeta: locationMetaPayload,
    });

    res.status(201).json({
      message: "Registration successful",
      userId: user._id,
      roles: user.roles,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: getRoleLoginError(role) });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account has been blocked. Please contact support." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: getRoleLoginError(role) });
    }

    if (role && !user.roles.includes(role)) {
      return res.status(403).json({ message: getRoleLoginError(role) });
    }

    const token = jwt.sign(
      {
        id: user._id,
        roles: user.roles,
      },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "1d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        locationMeta: user.locationMeta,
        roles: getUserRoles(user),
      },
    });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({ message: "Unable to process login right now. Please try again shortly." });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);

    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: normalizedEmail }).select("+passwordResetToken +passwordResetExpiresAt +passwordResetUsedAt");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const rawResetToken = crypto.randomBytes(32).toString("hex");
    const hashedResetToken = crypto.createHash("sha256").update(rawResetToken).digest("hex");

    user.passwordResetToken = hashedResetToken;
    user.passwordResetExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);
    user.passwordResetUsedAt = null;
    await user.save();

    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
    const resetLink = `${frontendUrl}/reset-password/${rawResetToken}`;

    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetLink,
    });

    res.json({
      success: true,
      message: emailResult.mode === "preview" ? "Reset link generated for local testing" : "Reset link sent",
      previewMessage: emailResult.previewMessage || "",
      resetLink: emailResult.mode === "preview" ? emailResult.resetLink : "",
    });
  } catch (error) {
    console.error("Forgot password failed:", error);
    res.status(500).json({ message: "Unable to send reset link right now. Please try again shortly." });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const resetToken = String(req.params.token || "").trim();

    if (!resetToken) {
      return res.status(400).json({ message: "Reset token is required" });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({ message: "New password and confirm password are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const passwordValidationError = validatePasswordStrength(password);
    if (passwordValidationError) {
      return res.status(400).json({ message: passwordValidationError });
    }

    const hashedResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedResetToken,
      passwordResetExpiresAt: { $gt: new Date() },
      passwordResetUsedAt: null,
    }).select("+passwordResetToken +passwordResetExpiresAt +passwordResetUsedAt");

    if (!user) {
      return res.status(400).json({ message: "Link expired" });
    }

    user.password = await bcrypt.hash(password, 10);
    clearPasswordResetFields(user);
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset password failed:", error);
    res.status(500).json({ message: "Unable to reset password right now. Please try again shortly." });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Old password, new password, and confirm password are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const passwordValidationError = validatePasswordStrength(newPassword);
    if (passwordValidationError) {
      return res.status(400).json({ message: passwordValidationError });
    }

    const user = await User.findById(req.user.id).select("+passwordResetToken +passwordResetExpiresAt +passwordResetUsedAt");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isCurrentPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: "New password must be different from your current password" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    clearPasswordResetFields(user);
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password failed:", error);
    res.status(500).json({ message: "Unable to change password right now. Please try again shortly." });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleUserBlock = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({
      success: true,
      user,
      message: user.isBlocked ? "User blocked successfully" : "User unblocked successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password;
    delete updates.roles;
    let user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const wantsLocationUpdate =
      typeof updates?.location?.lat !== "undefined" ||
      typeof updates?.location?.lng !== "undefined" ||
      typeof updates?.lat !== "undefined" ||
      typeof updates?.lng !== "undefined" ||
      typeof updates?.area !== "undefined" ||
      typeof updates?.city !== "undefined" ||
      typeof updates?.pincode !== "undefined";

    if (wantsLocationUpdate) {
      const resolvedLocation = await resolveLocationDetails({
        mode: updates.locationMode,
        lat: updates?.location?.lat ?? updates.lat,
        lng: updates?.location?.lng ?? updates.lng,
        area: updates.area,
        city: updates.city,
        pincode: updates.pincode,
        address: updates.address,
      });

      if (resolvedLocation.hasCoordinates) {
        user.location = resolvedLocation.coordinates;
      }
      user.locationMeta = {
        ...(user.locationMeta || {}),
        area: resolvedLocation.area || "",
        city: resolvedLocation.city || "",
        pincode: resolvedLocation.pincode || "",
        addressLabel: resolvedLocation.addressLabel || "",
        source: resolvedLocation.mode || "manual",
        resolvedBy: resolvedLocation.resolvedBy || "",
        lastUpdatedAt: new Date(),
      };
    }

    Object.entries(updates).forEach(([key, value]) => {
      if (
        [
          "location",
          "lat",
          "lng",
          "area",
          "city",
          "pincode",
          "address",
          "locationMode",
        ].includes(key)
      ) {
        return;
      }

      user[key] = value;
    });

    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getElectricians = async (req, res) => {
  try {
    const electricians = await User.find({ roles: "electrician" }).select("-password");
    res.json({ success: true, electricians });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
