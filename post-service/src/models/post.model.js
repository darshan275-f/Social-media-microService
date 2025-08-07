const mongoose=require("mongoose");
const postSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        require:true
    },
    content:{
        type:String,
        require:true
    },
    mediaIds :[
        {
            type:String
        }
    ]
},{
    timestamps:true
})

postSchema.index({content:'text'});

const Post=mongoose.model('Post',postSchema);

module.exports=Post;