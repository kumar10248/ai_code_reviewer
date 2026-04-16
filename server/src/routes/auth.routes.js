const express=require("express")
const router=express.Router()

const { register, login,changePassword } = require("../controllers/auth.controller")
const { authLimiter } = require("../middlewares/rateLimit")

const verifyJWT=require("../middlewares/auth.middleware")   

router.post("/register", register)
router.post("/login", authLimiter, login)
router.post("/change-password", verifyJWT, changePassword)
module.exports = router