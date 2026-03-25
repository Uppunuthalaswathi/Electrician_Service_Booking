const Booking = require("../models/Booking");

// 👤 USER → Create Booking
exports.createBooking = async (req, res) => {
  try {
    const { service, date, address, isEmergency } = req.body;

    const booking = await Booking.create({
      user: req.user.id,   // 🔥 from token
      service,
      date,
      address,
      isEmergency
    });

    res.status(201).json({ message: "Booking created", booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 👤 USER → View own bookings
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate("service")
      .populate("electrician");

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔧 ELECTRICIAN → View available bookings
exports.getAvailableBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ status: "pending" })
      .populate("user")
      .populate("service");

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 👑 ADMIN → View all bookings
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user")
      .populate("service")
      .populate("electrician");

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPendingBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ status: "pending" })
      .populate("service")
      .populate("user", "name email");

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.electrician.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not your booking" });
    }

    booking.status = "completed";

    await booking.save();

    res.json({ message: "Job completed", booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.acceptBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: "accepted" },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ message: "Booking accepted", booking });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAssignedBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      electrician: req.user.id,
      status: "accepted"
    })
      .populate("user", "name email")
      .populate("service");

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.assignElectrician = async (req, res) => {
  try {
    const { electricianId } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        electrician: electricianId,
        status: "accepted"
      },
      { new: true }
    );

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Booking deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate("service electrician");

    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};