const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    electrician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    electricianProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      default: null,
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    serviceName: {
      type: String,
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    timeSlot: {
      type: String,
      required: true,
    },

    isEmergency: {
      type: Boolean,
      default: false,
    },

    userLocation: {
      lat: {
        type: Number,
        default: null,
      },
      lng: {
        type: Number,
        default: null,
      },
    },

    userLocationMeta: {
      area: {
        type: String,
        default: "",
      },
      city: {
        type: String,
        default: "",
      },
      pincode: {
        type: String,
        default: "",
      },
      addressLabel: {
        type: String,
        default: "",
      },
      source: {
        type: String,
        default: "manual",
      },
    },

    electricianLocation: {
      lat: {
        type: Number,
        default: null,
      },
      lng: {
        type: Number,
        default: null,
      },
      updatedAt: {
        type: Date,
        default: null,
      },
    },

    electricianLocationMeta: {
      area: {
        type: String,
        default: "",
      },
      city: {
        type: String,
        default: "",
      },
      pincode: {
        type: String,
        default: "",
      },
      addressLabel: {
        type: String,
        default: "",
      },
      source: {
        type: String,
        default: "manual",
      },
    },

    address: {
      type: String,
      required: true,
    },

    problemDescription: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      required: true,
      default: 0,
    },

    distanceKm: {
      type: Number,
      default: 0,
    },

    estimatedArrival: {
      type: String,
      default: "60 mins",
    },

    estimatedArrivalMinutes: {
      type: Number,
      default: 60,
    },

    paymentMode: {
      type: String,
      default: "Pay After Service",
    },

    priority: {
      type: String,
      enum: ["normal", "emergency"],
      default: "normal",
    },

    status: {
      type: String,
      enum: ["pending", "assigned", "accepted", "on_the_way", "arrived", "rejected", "completed", "cancelled"],
      default: "pending",
    },

    rejectedReason: {
      type: String,
      default: "",
    },

    confirmedAt: {
      type: Date,
      default: null,
    },

    statusHistory: [
      {
        status: String,
        note: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    payment: {
      method: {
        type: String,
        enum: ["UPI", "Card", "Cash", ""],
        default: "",
      },
      status: {
        type: String,
        enum: ["unpaid", "paid"],
        default: "unpaid",
      },
      amount: {
        type: Number,
        default: 0,
      },
      billNumber: {
        type: String,
        default: "",
      },
      paidAt: {
        type: Date,
        default: null,
      },
    },

    review: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      feedback: {
        type: String,
        default: "",
      },
      createdAt: {
        type: Date,
        default: null,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
