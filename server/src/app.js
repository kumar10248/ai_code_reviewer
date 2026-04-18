const express=require("express")
const app=express()

app.use(express.json())
const cors = require("cors");

app.use(cors({
  origin: "https://reviewai.devashish.top",
  credentials: true
}));
app.set("trust proxy", 1)
const { globalLimiter } = require("./middlewares/rateLimit")
app.use(globalLimiter)

const reviewRoutes=require("./routes/review.routes")
const authRoutes=require("./routes/auth.routes")


app.get('/',(req,res)=>{
    res.send("Welcome to AI Code Review API")
})

app.use('/api/v1/auth',authRoutes)
app.use('/api/v1/reviews',reviewRoutes)
module.exports=app