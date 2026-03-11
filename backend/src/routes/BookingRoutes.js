const express = require("express");
const router = express.Router();

const { createBooking } = require("../controllers/BookingController");

router.post("/create", createBooking);

module.exports = router;