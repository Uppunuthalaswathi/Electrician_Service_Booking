const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    electrician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service"
    },

    date: { type: Date, required: true },

    isEmergency: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ["pending", "assigned", "completed", "cancelled"],
      default: "pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);