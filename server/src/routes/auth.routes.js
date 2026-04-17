const express=require("express")
const router=express.Router()

const { register, login,changePassword ,refreshAccessToken,getUserData} = require("../controllers/auth.controller")
const { authLimiter } = require("../middlewares/rateLimit")

const verifyJWT=require("../middlewares/auth.middleware")   

router.post("/register", register)
router.post("/refresh", refreshAccessToken)


router.post("/login", authLimiter, login)
router.get('/me',verifyJWT,getUserData)
router.post("/change-password", verifyJWT, changePassword)

module.exports = router