// controllers/review.controller.js
const Review = require("../models/Review")
const Comment = require("../models/Comment")
const { detectLanguage } = require("../services/language.service")
const { streamAIReview } = require("../services/ai.service")
const nanoid = async (size = 12) => {
  const { nanoid } = await import('nanoid')
  return nanoid(size)
}
// ─── POST /api/reviews ───────────────────────────────────────────
// Creates review, detects language, streams AI response via SSE
const createReview = async (req, res) => {
  const { code } = req.body

  if (!code || code.trim() === "") {
    return res.status(400).json({ message: "Code is required" })
  }

  try {
    const language = detectLanguage(code)

    const review = await Review.create({
      userId: req.user.id,
      code,
      language,
      aiSummary: ""
    })

    // ✅ correct destructuring
    const { summary, score, comments, fix, tags } =
      await streamAIReview(code, language)

    // ✅ use summary directly
    review.aiSummary = summary
    review.score=score
    review.fix=fix

    await review.save()

    if (comments.length > 0) {
      await Comment.insertMany(
        comments.map((c) => ({ ...c, reviewId: review._id }))
      )
    }

    return res.json({
      success: true,
      reviewId: review._id,
      summary,
      score,
      comments,
      fix,
      tags
    })

  } catch (err) {
    console.error("createReview error:", err)
    return res.status(500).json({ message: "Server error" })
  }
}

// ─── GET /api/reviews ────────────────────────────────────────────
// Returns paginated list of reviews for logged-in user
const getAllReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const [reviews, total] = await Promise.all([
      Review.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("language aiSummary createdAt shareToken score"), // don't send full code in list
      Review.countDocuments({ userId: req.user.id })
    ])

    res.json({
      reviews,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (err) {
    console.error("getAllReviews error:", err)
    res.status(500).json({ message: "Server error" })
  }
}

// ─── GET /api/reviews/:id ─────────────────────────────────────────
// Returns single review + its inline comments
const getReviewById = async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      userId: req.user.id   // ensures user can only see their own reviews
    })

    if (!review) {
      return res.status(404).json({ message: "Review not found" })
    }

    const comments = await Comment.find({ reviewId: review._id })
      .sort({ lineNumber: 1 })  // sorted so frontend renders top to bottom

    res.json({ review, comments })

  } catch (err) {
    console.error("getReviewById error:", err)
    res.status(500).json({ message: "Server error" })
  }
}

// ─── DELETE /api/reviews/:id ──────────────────────────────────────
// Deletes review and all its comments
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      userId: req.user.id
    })

    if (!review) {
      return res.status(404).json({ message: "Review not found" })
    }

    // Delete comments first, then the review
    await Comment.deleteMany({ reviewId: review._id })
    await review.deleteOne()

    res.json({ message: "Review deleted successfully" })

  } catch (err) {
    console.error("deleteReview error:", err)
    res.status(500).json({ message: "Server error" })
  }
}


// ─── POST /api/reviews/:id/share ─────────────────────────────────
// Generates a share token with 7-day expiry
const createShareLink = async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      userId: req.user.id
    })

    if (!review) {
      return res.status(404).json({ message: "Review not found" })
    }

    // If share already exists just return it
    if (review.shareToken && review.shareExpiresAt > new Date()) {
      return res.json({
        shareToken: review.shareToken,
        shareExpiresAt: review.shareExpiresAt
      })
    }

    // Generate fresh token + 7-day expiry
    review.shareToken = await nanoid(12)
    review.shareExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await review.save()

    res.json({
      shareToken: review.shareToken,
      shareExpiresAt: review.shareExpiresAt
    })

  } catch (err) {
    console.error("createShareLink error:", err)
    res.status(500).json({ message: "Server error" })
  }
}

// ─── DELETE /api/reviews/:id/share ───────────────────────────────
// Revokes share link by nullifying token
const revokeShareLink = async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      userId: req.user.id
    })

    if (!review) {
      return res.status(404).json({ message: "Review not found" })
    }

    review.shareToken = null
    review.shareExpiresAt = null
    await review.save()

    res.json({ message: "Share link revoked" })

  } catch (err) {
    console.error("revokeShareLink error:", err)
    res.status(500).json({ message: "Server error" })
  }
}

// ─── GET /api/share/:token ────────────────────────────────────────
// Public route — no auth needed, just a valid non-expired token
const getSharedReview = async (req, res) => {
  try {

    const review = await Review.findOne({
      shareToken: req.params.token,
      shareExpiresAt: { $gt: new Date() }  // token must not be expired
    }).select("-userId")  // don't expose who owns it

    if (!review) {
      return res.status(404).json({ message: "Link is invalid or has expired" })
    }

    const comments = await Comment.find({ reviewId: review._id })
      .sort({ lineNumber: 1 })

    res.json({ review, comments })

  } catch (err) {
    console.error("getSharedReview error:", err)
    res.status(500).json({ message: "Server error" })
  }
}

module.exports = {
  createReview,
  getAllReviews,
  getReviewById,
  deleteReview,
  createShareLink,
  revokeShareLink,
  getSharedReview
}