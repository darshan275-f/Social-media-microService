require('dotenv').config({path:"./.env"})
const express=require("express");
const cors= require("cors");
const Redis=require("ioredis");
const helmet=require("helmet");
const {rateLimit}=require("express-rate-limit");
const {RedisStore}=require("rate-limit-redis");
const logger=require("./utils/logger.util.js");
const proxy=require("express-http-proxy");
const errorHandler = require('./middleware/errorHandler.middleware.js');
const verifyJwt=require("./middleware/auth.middleware.js")
const cookie=require("cookie-parser");


const app=express();
const PORT=process.env.PORT || 3000;

const redisClient=new Redis(process.env.REDIS_URL);

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(cookie())


const ratelimit=rateLimit({
    windowMs:15*60*1000,
    max:100,
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

app.use(ratelimit);


app.use((req,res,next)=>{
    logger.info(`Recevied ${req.method} request to ${req.url}`);
    logger.info(`request body, ${req.body}`);
    next();
})


const proxyOptions={
    proxyReqPathResolver : (req)=>{
        return req.originalUrl.replace(/^\/v1/,"/api");
    },
    proxyErrorHandler : (err,res,next)=>{
        logger.error(`Proxy error : ${err.message}`);
        res.status(500).json({
            message:`Internal server error`,error:err.message
        })
    }
}

//setting up proxy for our identity service
app.use('/v1/auth',proxy( process.env.IDENTITY_SERVICE_URL,{
    ...proxyOptions,
    proxyReqOptDecorator:(proxyReqOpts,srcReq)=>{
        proxyReqOpts.headers["content-Type"]="application/json"
        return proxyReqOpts;
    },
    userResDecorator : (proxyRes,proxyResData,userReq,userRes)=>{
        logger.info(`Response received from Identity service: ${proxyRes.statusCode}`)
        return proxyResData;
    }
}))

//setting up proxy for our identity service
app.use('/v1/post',verifyJwt,proxy( process.env.POST_SERVICE_URL,{
    ...proxyOptions,
    proxyReqOptDecorator:(proxyReqOpts,srcReq)=>{
        proxyReqOpts.headers["content-Type"]="application/json",
        proxyReqOpts.headers["x-user-id"] = srcReq.user._id;
        return proxyReqOpts;
    },
    userResDecorator : (proxyRes,proxyResData,userReq,userRes)=>{
        logger.info(`Response received from Identity service: ${proxyRes.statusCode}`)
        return proxyResData;
    }
}))

app.use(errorHandler);

app.listen(PORT,()=>{
   
    logger.info(`API Gateway is Running on Port ${PORT}`);

})