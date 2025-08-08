const cloudinary=require("cloudinary").v2;
const logger=require("./logger.util.js");

cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUD_API_KEY,
    api_secret:process.env.CLOUD_API_SECRET
});

const uploadMediaToCloudinary=(file)=>{
    return new Promise((resolve,reject)=>{
        const uploadStream=cloudinary.uploader.upload_stream(
            {
                resource_type:"auto"
            },
            (error,result)=>{
                if(error){
                    logger.error('error while uploading media to cloudinary');
                    reject(error);
                }
                else{
                    resolve(result);
                }
            }
        )
        uploadStream.end(file.buffer);
    })
}

module.exports={uploadMediaToCloudinary};