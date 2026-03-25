const User = require("../models/Users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// 🔐 REGISTER (MULTI-ROLE SUPPORT)
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    let user = await User.findOne({ email });

    // 🟢 If user exists → ADD ROLE
    if (user) {
      // ensure roles array exists (for old data safety)
      if (!user.roles) {
        user.roles = ["user"];
      }

      // add role if not already present
      if (role && !user.roles.includes(role)) {
        user.roles.push(role);
        await user.save();
      }

      return res.status(200).json({
        message: "Role added successfully",
        userId: user._id,
        roles: user.roles
      });
    }

    // 🔐 Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 🆕 Create new user
    user = await User.create({
      name,
      email,
      password: hashedPassword,
      roles: [role || "user"]
    });

    res.status(201).json({
      message: "User registered successfully",
      userId: user._id,
      roles: user.roles
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 🔑 LOGIN (WITH ROLES IN TOKEN)
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 🔥 include roles in token
    const token = jwt.sign(
      { id: user._id, roles: user.roles },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      userId: user._id,
      roles: user.roles
    });
    console.log("LOGIN CONTROLLER RUNNING");
console.log("USER ROLES:", user.roles);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 👨‍💼 ADMIN - Get All Users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// 👨‍💼 ADMIN - Delete User
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// 👤 Get Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// 👤 Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      req.body,
      { new: true }
    );

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// 🔧 Get All Electricians
exports.getElectricians = async (req, res) => {
  try {
    const electricians = await User.find({ roles: "electrician" });
    res.json({ success: true, electricians });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};