const express = require("express");
const router = express.Router();

const {
  createReview,
  getAllReviews,
  getReviewById,
  deleteReview,
  createShareLink,
  revokeShareLink,
  getSharedReview,
} = require("../controllers/review.controller");

const { aiReviewLimiter,shareLimiter } = require("../middlewares/rateLimit");
const verifyJWT = require("../middlewares/auth.middleware");


// console.log("verifyJWT:", verifyJWT)
// console.log("createReview:", createReview)

router.post("/",verifyJWT,aiReviewLimiter ,createReview);
router.get("/", verifyJWT,getAllReviews);
router.get("/:id", verifyJWT, getReviewById);
router.delete("/:id", verifyJWT, deleteReview);
router.post("/:id/share", verifyJWT, shareLimiter, createShareLink)
router.delete("/:id/share",verifyJWT,  revokeShareLink);
router.get("/share/:token", getSharedReview)  


module.exports = router;
