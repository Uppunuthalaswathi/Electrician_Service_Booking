const Booking = require("../models/Booking");
const Message = require("../models/Message");

async function ensureBookingParticipant(bookingId, userId, roles) {
  const booking = await Booking.findById(bookingId);
  if (!booking) return { error: "Booking not found" };

  const allowed =
    String(booking.user) === userId ||
    String(booking.electrician) === userId ||
    roles.includes("admin");

  if (!allowed) return { error: "Access denied" };
  return { booking };
}

exports.getMessages = async (req, res) => {
  try {
    const access = await ensureBookingParticipant(req.params.bookingId, req.user.id, req.user.roles);
    if (access.error) {
      return res.status(access.error === "Booking not found" ? 404 : 403).json({ message: access.error });
    }

    const messages = await Message.find({ booking: req.params.bookingId })
      .populate("sender", "name roles")
      .populate("receiver", "name roles")
      .sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const access = await ensureBookingParticipant(req.params.bookingId, req.user.id, req.user.roles);
    if (access.error) {
      return res.status(access.error === "Booking not found" ? 404 : 403).json({ message: access.error });
    }

    const { booking } = access;
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const receiver =
      String(booking.user) === req.user.id ? booking.electrician : booking.user;

    const savedMessage = await Message.create({
      booking: booking._id,
      sender: req.user.id,
      receiver,
      message: message.trim(),
    });

    const populatedMessage = await Message.findById(savedMessage._id)
      .populate("sender", "name roles")
      .populate("receiver", "name roles");

    res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
