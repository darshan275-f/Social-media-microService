const logger=require("../utlis/logger.util.js");
const uploadMediaToCloudinary=require("../utlis/cloudinary.js");
const Media=require("../models/media.model.js")

const uploadMedia=async(req,res)=>{
    logger.info("starting media upload");
    try{
        if(!req.file){
            logger.error("no file found");
            return res.status(200).json({
                success:false,
                message:"No file found"
            })
        }

        const {originalName,mimeType,buffer}=req.file;
        const userId=req.user.userId;

        logger.info(`File details: name=${originalName},type=${mimeType}`);
        logger.info("uploading to cloudinary starting...");

        const cloudinaryUploadResult=await uploadMediaToCloudinary(req.file);
        logger.info(`cloudinary upload successfully. Public Id:- ${cloudinaryUploadResult.public_id}`);

        const newlyCreatedMedia=new Media({
            publicId:cloudinaryUploadResult.public_id,
            originalName,
            mimeType,
            url:cloudinaryUploadResult.secure_url,
            userId
        })
        await newlyCreatedMedia.save();

        res.status(201).json({
            success:true,
            mediaId:newlyCreatedMedia._id,
            url:newlyCreatedMedia.url,
            message:"Media upload successfully"
        })
    }
    catch(err){

    }
}

module.export={uploadMedia};