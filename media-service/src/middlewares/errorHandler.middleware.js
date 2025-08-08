const logger=require("../utils/logger.util.js");

const Errorhandler=(err,req,res,next)=>{
    logger.error(err.stack);
    res.status(err.statusCode || 500).json({
        message:err.message || "something went bad" 
    })
    
}

module.exports=Errorhandler;