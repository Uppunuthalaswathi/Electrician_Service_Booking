const Booking = require("../models/Booking");

exports.createBooking = async (req, res) => {
  try {

    const booking = new Booking(req.body);

    const savedBooking = await booking.save();

    res.status(201).json(savedBooking);

  } catch (error) {

    res.status(500).json({ message: error.message });

  }
};