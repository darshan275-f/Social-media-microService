const express=require("express");
const multer=require("multer");
const {uploadMedia}=require("../controllers/media.controller.js");
const [verifyJwt]=require("../middlewares/auth.middleware.js");
const logger=require("../utlis/logger.util.js");
const { stack } = require("../../../post-service/src/routes/post.route");

const router=express.Router();

const upload=multer({
    storage:multer.memoryStorage(),
    limits:{

        fileSize: 5*1024*1024
    }
}).single('file');

router.route("/upload").post(verifyJwt,
    (req,res,next)=>{
    upload(req,res,function(err){
        if(err instanceof multer.MulterError){
            logger.error(`multer error while uploading: ${err}`);
            return res.status(400).json({
                message:"multer error while uploading",
                error:err.message,
                stack:err.stack
            })
        }
        else if(err){
            logger.error(`unknown error occured while uploading: ${err}`);
            return res.status(500).json({
                message:"unknown error occured while uploading",
                error:err.message,
                stack:err.stack
            })
        }
        if(!req.file){
               return res.status(400).json({
                message:"No file found",
               
            })
        }
        next();
    })
},uploadMedia)

module.exports=router;