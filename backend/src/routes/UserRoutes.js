const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  changePassword,
  getAllUsers,
  deleteUser,
  toggleUserBlock,
  getProfile,
  updateProfile,
  getElectricians
} = require("../controllers/UserController");

// ✅ ADD THESE (🔥 FIX)
const auth = require("../middleware/auth");
const roleMiddleware = require("../middleware/roleMiddleware");

// 🔐 Auth routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/change-password", auth, changePassword);

// 👨‍💼 Admin routes
router.get("/all", auth, roleMiddleware("admin"), getAllUsers);
router.delete("/:id", auth, roleMiddleware("admin"), deleteUser);
router.put("/block/:id", auth, roleMiddleware("admin"), toggleUserBlock);

// 👤 Get Profile
router.get("/profile", auth, getProfile);

// 👤 Update Profile
router.put("/profile", auth, updateProfile);

// 👑 Get Electricians (IMPORTANT)
router.get(
  "/electricians",
  auth,
  roleMiddleware("admin"),
  getElectricians
);
module.exports = router;
