const express = require("express");
const router = express.Router();

const {
  createBooking,
  getMyBookings,        // ✅ ADD
  getPendingBookings,
  acceptBooking,
  getAssignedBookings,
  completeBooking,
  getAllBookings,
  assignElectrician,    // ✅ ADD
  deleteBooking 
} = require("../controllers/BookingController");

const auth = require("../middleware/auth");
const roleMiddleware = require("../middleware/roleMiddleware");

// 👤 User
router.post("/create", auth, roleMiddleware("user"), createBooking);
router.get("/my", auth, roleMiddleware("user"), getMyBookings);

// 🔧 Electrician
router.get("/pending", auth, roleMiddleware("electrician"), getPendingBookings);
router.get("/assigned", auth, roleMiddleware("electrician"), getAssignedBookings);

router.put("/accept/:id", auth, roleMiddleware("electrician"), acceptBooking);
router.put("/complete/:id", auth, roleMiddleware("electrician"), completeBooking);

// 👑 Admin
router.get("/all", auth, roleMiddleware("admin"), getAllBookings);
router.put("/assign/:id", auth, roleMiddleware("admin"), assignElectrician);
router.delete("/:id", auth, roleMiddleware("admin"), deleteBooking);
module.exports = router;