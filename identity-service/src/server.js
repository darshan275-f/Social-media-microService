const express=require("express");
const cookie=require("cookie-parser");
const dotenv =require("dotenv");
const mongoose=require("mongoose");
const helmet=require("helmet");
const cors=require("cors");
const router=require("./routes/user.route.js");
const logger = require("./utils/logger.util.js");
const {RateLimiterRedis}=require("rate-limiter-flexible")
const Redis=require("ioredis");
const {rateLimit}=require("express-rate-limit")
const {RedisStore}=require("rate-limit-redis");
const errorHandler=require("./middleware/error.middleware.js");


dotenv.config({path:"./.env"});
const app=express();


const connectToDB=async()=>{
await mongoose.connect(process.env.MONGODB_URL)
}
connectToDB().then(()=>logger.info("DB connected")).catch((err)=>logger.error("Went wrong while connecting to db"));

const redisClient=new Redis(process.env.REDIS_URL);



app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded());
app.use(cookie());

app.use((req,res,next)=>{
    logger.info(`Recevied ${req.method} request to ${req.url}`);
    logger.info(`request body, ${req.body}`);
    next();
})


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

//Ip based rate limiting for sensitive endpoint
const sensitiveEndpointsLimiter= rateLimit({
    windowMs:15*60*1000,
    max:50,
    standardHeaders:true,
    legacyHeaders:false,
    handler:(req,res)=>{
        logger.warn('sensitive endpoint rate limit excceded ');
        res.status(429).json({success:false,message:"Too Many Requests!!"});
    },
    store: new RedisStore({
        sendCommand: (...args)=>redisClient.call(...args),
    })
})

app.use('/api/auth/register',sensitiveEndpointsLimiter);


//routes
app.use("/api/auth/",router);

app.use(errorHandler);

app.listen(process.env.PORT,()=>{
    logger.info("Server running on port "+process.env.PORT);
});

//unhandler

app.on("unhandledRejection",(reason,promise)=>{
    logger.error("unhandled Rejection at",promise,"reason: ",reason);
})
