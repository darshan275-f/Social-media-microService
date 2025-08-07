require("dotenv").config({path:"./.env"});
const express=require("express");
const cookie=require("cookie-parser");
const mongoose=require("mongoose");
const helmet=require("helmet");
const cors=require("cors");
const {ApiError} =require("./utils/ApiError.js");
const {ApiResponse}=require("./utils/ApiResponse.js");
const logger=require("./utils/logger.util.js");
const Errorhandler=require("./middlewares/errorHandler.middleware.js");
const {RateLimiterRedis}=require("rate-limiter-flexible")
const Redis=require("ioredis");
const app=express();


const connectToDB=async()=>{
try{
await mongoose.connect(process.env.MONGODB_URL);
logger.info("Connected to DB");
}
catch(err){
    throw new ApiError("Error while trying to connect Database!!",500);
}
}
connectToDB();

app.use(express.json());
app.use(cors());
app.use(cookie());
app.use(helmet());
app.use(express.urlencoded({extended:true}));

const redisClient=new Redis(process.env.REDIS_URL);

//DDOS Protection
const rateLimiter=new RateLimiterRedis({
    storeClient:redisClient,
    keyPrefix: 'middleware',
    points:10,
    duration:1
})

app.use((req,res,next)=>{
    rateLimiter.consume(req.ip).then(()=>next()).catch(()=>{
        logger.warn(`rate limit exceeded for ip: ${req.ip}`);
        res.status(429).json({success:false,message:"Too Many Requests!!"})
    })
})


const Router=require("./routes/post.route.js");
app.use("/api/post",Router);

app.listen(process.env.PORT,()=>{
    logger.info(`Server is running on port ${process.env.PORT}`);
})

app.use(Errorhandler);
app.on("unhandledRejection",(reason,promise)=>{
    logger.error("unhandled Rejection at",promise,"reason: ",reason);
})



