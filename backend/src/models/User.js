const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    password: { type: String, required: true },

    passwordResetToken: {
      type: String,
      default: null,
      select: false,
    },

    passwordResetExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },

    passwordResetUsedAt: {
      type: Date,
      default: null,
      select: false,
    },

    roles: {
      type: [String],
      default: ["user"]
    },

    phone: String,

    isBlocked: {
      type: Boolean,
      default: false,
    },

    profilePic: {
      type: String,
      default: "",
    },

    location: {
      lat: Number,
      lng: Number
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
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
