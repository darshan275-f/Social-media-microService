const logger=require("../utils/logger.util.js");
const {ApiError}=require("../utils/ApiError.js");
const {ApiResponse}=require("../utils/ApiResponse.js");
const Post=require("../models/post.model.js")



async function InvalidPostCache(req,input) {
    const cacheKey=`post:${input}`;
    if(cacheKey){
        await req.redisClient.del(cacheKey);
    }

    const keys=await req.redisClient.keys("posts:*");
    if(keys.length>0) {await req.redisClient.del(keys);}
}


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
        await InvalidPostCache(req,post._id.toString());
        return res.status(200).json(new ApiResponse("Post Created SuccessFully1!",post));
    }
    catch(err){
        logger.error("Error while creating post",err);
        res.status(500).json({
            message:"Error while creating post"
        })
    }
}


const getAllPosts=async(req,res)=>{
     try{

        const page=parseInt(req.query.page) || 1;
        const limit=parseInt(req.query.limit) ||10;
        const startIndex=(page-1)*limit;

        const cacheKey=`posts:${page}:${limit}`;
        const cachedPosts=await req.redisClient.get(cacheKey);
        if(cachedPosts){
            return res.status(200).json(new ApiResponse("All Posts fetched!", JSON.parse(cachedPosts)));
        }
        const posts=await Post.find({}).sort({createdAt:-1}).skip(startIndex).limit(limit);

        const totalNoOfPosts=await Post.countDocuments();

        const result={
            posts,
            currentpage:page,
            totalPages:Math.ceil(totalNoOfPosts/limit),
            totalPosts:totalNoOfPosts
        }
        await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));

       return res.status(200).json(new ApiResponse("All Posts Fetched!!",result));

     }
     catch(err){

     }
}

const getPost=async(req,res)=>{
    const postId=req.params.id;
    const cacheKey=`post:${postId}`;
    const cachePost=await req.redisClient.get(cacheKey);
    if(cachePost){
      return  res.status(200).json(new ApiResponse("Post fetched!",JSON.parse(cachePost)));
    }
    const post=await Post.findById(postId);
    if(!post){
        throw new ApiError("Post not found",404);
    }
    await req.redisClient.setex(cacheKey,3600,JSON.stringify(post));
    return res.status(200).json(new ApiResponse("Post fetched!",post));

}

const deletePost=async(req,res)=>{
    const postId=req.params.id;
    const post=await Post.findOneAndDelete({
        _id:postId,
        user:req.user.userId
    })
    if(!post){
        throw new ApiError("Post Not Found!!",404);
    }
    await InvalidPostCache(req,postId);
    return res.status(200).json(new ApiResponse("Post Deleted!",{}));
}

module.exports={
    createPost,
    getAllPosts,
    getPost,
    deletePost
}