const express = require("express");
const router = express.Router();

const {
  createBooking,
  getMyBookings,
  getTrackableBookings,
  getBookingDetails,
  getElectricianBookings,
  acceptBooking,
  rejectBooking,
  updateBookingStatus,
  updateLiveLocation,
  cancelBooking,
  makePayment,
  submitReview,
  getAllBookings,
  assignElectrician,
  deleteBooking,
} = require("../controllers/BookingController");

const auth = require("../middleware/auth");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post("/create", auth, roleMiddleware("user"), createBooking);
router.get("/my", auth, roleMiddleware("user"), getMyBookings);
router.get("/track", auth, roleMiddleware("user"), getTrackableBookings);
router.post("/cancel/:id", auth, roleMiddleware("user"), cancelBooking);
router.post("/payment/:id", auth, roleMiddleware("user"), makePayment);
router.post("/review/:id", auth, roleMiddleware("user"), submitReview);
router.get("/electrician", auth, roleMiddleware("electrician"), getElectricianBookings);
router.put("/accept/:id", auth, roleMiddleware("electrician"), acceptBooking);
router.put("/reject/:id", auth, roleMiddleware("electrician"), rejectBooking);
router.put("/status/:id", auth, roleMiddleware("electrician"), updateBookingStatus);
router.put("/location/:id", auth, roleMiddleware("electrician"), updateLiveLocation);
router.get("/all", auth, roleMiddleware("admin"), getAllBookings);
router.put("/assign/:id", auth, roleMiddleware("admin"), assignElectrician);
router.delete("/:id", auth, roleMiddleware("admin"), deleteBooking);
router.get("/:id", auth, getBookingDetails);

module.exports = router;
