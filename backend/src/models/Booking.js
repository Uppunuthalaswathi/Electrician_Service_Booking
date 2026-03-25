const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    // 👤 User who booked service
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // 🔧 Electrician (assigned later)
    electrician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // 🛠️ Service selected
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true
    },

    // 📅 Booking date
    date: {
      type: Date,
      required: true
    },

    // 🚨 Emergency booking
    isEmergency: {
      type: Boolean,
      default: false
    },

    // 📍 Address (IMPORTANT for real app)
    address: {
      type: String,
      required: true
    },

    // 🔄 Status tracking
    status: {
      type: String,
      enum: ["pending", "assigned", "accepted", "completed", "cancelled"],
      default: "pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);