const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    electrician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    name: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      required: true,
      default: "electrician",
    },

    price: {
      type: Number,
      required: true,
    },

    distanceKm: {
      type: Number,
      default: 5,
    },

    rating: {
      type: Number,
      default: 4,
    },

    reviewsCount: {
      type: Number,
      default: 0,
    },

    available: {
      type: Boolean,
      default: true,
    },

    experience: {
      type: Number,
      default: 1,
    },

    verified: {
      type: Boolean,
      default: true,
    },

    profilePic: {
      type: String,
      default: "",
    },

    services: [
      {
        type: String,
      },
    ],

    phone: {
      type: String,
      default: "",
    },

    servicePricing: {
      type: Map,
      of: Number,
      default: {},
    },

    location: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
    },

    locationMeta: {
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
      resolvedBy: {
        type: String,
        default: "",
      },
      lastUpdatedAt: {
        type: Date,
        default: null,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", serviceSchema);
