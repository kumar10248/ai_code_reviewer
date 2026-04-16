// middleware/rateLimit.js
const rateLimit = require("express-rate-limit")
const { ipKeyGenerator } = require("express-rate-limit")

// ─── For AI review endpoint ───────────────────────────────────────
// Most important one — OpenAI calls cost money


const aiReviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,

  keyGenerator: (req) => {
    // Logged-in user → user ID
    if (req.user?.id) return `user-${req.user.id}`

    // Guest user → safe IP generator (IPv6 safe)
    return ipKeyGenerator(req)
  },

  handler: (req, res) => {
    res.status(429).json({
      message: "Too many reviews. You can submit 10 reviews per hour. Try again later.",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    })
  },

  standardHeaders: true,
  legacyHeaders: false
})

// ─── For auth endpoints ───────────────────────────────────────────
// Prevents brute force attacks on login
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,

  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req)
    const email = req.body?.email || "unknown"
    return `${ip}-${email}`
  },

  skipSuccessfulRequests: true,

  handler: (req, res) => {
    res.status(429).json({
      message: "Too many login attempts. Please wait 15 minutes and try again."
    })
  },

  standardHeaders: true,
  legacyHeaders: false
})
// ─── For share link endpoint ──────────────────────────────────────
// Prevents someone spamming share link generation

const shareLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,

  keyGenerator: (req) => {
    if (req.user?.id) {
      return `user-${req.user.id}`
    }

    return `guest-${ipKeyGenerator(req)}`
  },

  handler: (req, res) => {
    res.status(429).json({
      message: "Too many share link requests. Try again in an hour."
    })
  },

  standardHeaders: true,
  legacyHeaders: false
})
// ─── Global fallback limiter ──────────────────────────────────────
// Applied to all routes in app.js as a safety net

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min

  max: (req) => {
    if (req.user?.plan === "premium") return 1000
    if (req.user) return 300
    return 100
  },

  keyGenerator: (req) => {
    if (req.user?.id) {
      return `user-${req.user.id}`
    }
    return `guest-${ipKeyGenerator(req)}`
  },

  handler: (req, res) => {
    res.status(429).json({
      message: "Too many requests. Please slow down."
    })
  },

  standardHeaders: true,
  legacyHeaders: false
})

module.exports = { aiReviewLimiter, authLimiter, shareLimiter, globalLimiter }