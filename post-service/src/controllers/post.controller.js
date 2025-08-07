const logger=require("../utils/logger.util.js");
const {ApiError}=require("../utils/ApiError.js");
const {ApiResponse}=require("../utils/ApiResponse.js");
const Post=require("../models/post.model.js")

const createPost=async(req,res)=>{
    try{
        const {content,mediaIds}=req.body;
        
        if(!req.user){
             logger.error("need to log in!!");
            throw new ApiError("User need to login!!",400);
        }
        if(!content){
            logger.error("User and Content can't be empty!!");
            throw new ApiError("User and Content cant be empty!!",400);
        }

        const post=await Post.create({
           user:req.user.userId,
            content:content,
            mediaIds:mediaIds || []
        });
        if(!post){
            logger.error("Error while saving post to DB");
            throw new ApiError("Error while saving post to Db",400);
        }
        return res.status(200).json(new ApiResponse("Post Created SuccessFully1!",post));
    }
    catch(err){
        logger.error("Error while creating post",err);
        res.status(500).json({
            message:"Error while creating post"
        })
    }
}

module.exports={
    createPost
}