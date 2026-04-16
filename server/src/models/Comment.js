// models/Comment.js
const mongoose = require("mongoose")

const commentSchema = new mongoose.Schema({
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Review",
    required: true
  },
  lineNumber: {
    type: Number,
    required: true
  },
  severity: {
    type: String,
    enum: ["info", "warning", "error"], 
    required: true
  },
  message: {
    type: String,
    required: true
  },
  suggestion: {
    type: String,
    default: ""   
  },
category: {
  type: String,
  enum: ["security", "performance", "style", "bug", "best_practice", "type_safety"],
  required: true
}
}, { timestamps: true })

module.exports = mongoose.model("Comment", commentSchema)