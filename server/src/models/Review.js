// models/Review.js
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    aiSummary: {
      type: String,
      default: "",
    },
    score: {
      type: Number,
      default: 0,
    },
    fix: {
      type: String,
      default: "",
    },

    shareToken: {
      type: String,
      index: true,
      default: null,
    },
    shareExpiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Review", reviewSchema);
