const logger=require("../utlis/logger.utils.js");

const createPost=async(req,res)=>{
    try{

    }
    catch(err){
        logger.error("Error while creating post",err);
        res.status(500).json({
            message:"Error while creating post"
        })
    }
}

co