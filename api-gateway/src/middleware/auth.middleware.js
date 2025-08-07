const Jwt = require("jsonwebtoken");
const logger=require("../utils/logger.util.js")
 const verifyJwt=async (req,res,next)=>{
        
            try{
            let token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
            if(!token){
                 return res.status(500).json({
                message:"unauthorized access"
            })
            }
            
            let decodedToken= Jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
            req.user=decodedToken;
            next();
        }
        catch(err){
            logger.error("error while verfying "+err);
            return res.status(500).json({
                message:"error while verfying jwt"
            })
        }
       
       
}

module.exports=verifyJwt;