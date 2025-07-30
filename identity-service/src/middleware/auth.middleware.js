const { User } = require("../models/user.model.js");
const { ApiError } = require("../utils/ApiError.js");
const { asynchandler } = require("../utils/asynchandler.js");
const Jwt = require("jsonwebtoken");


 const verifyJwt=asynchandler(async (req,_,next)=>{
        

            let token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
            if(!token){
                throw new ApiError("Unauthrozied Access",401);
            }
            let decodedToken= Jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
            let user =await User.findById(decodedToken?._id).select("-password -refreshToken");
            if(!user){
                throw new ApiError("Invalid access Token",401);
            }
            req.user=user;
            
            next();

       
       
})

module.exports={verifyJwt}