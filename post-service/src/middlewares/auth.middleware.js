

const { asynchandler } = require("../utils/asynchandler.js");


 const verifyJwt=asynchandler(async (req,_,next)=>{
        

           const userId=req.headers['x-user-id'];
           req.user={userId};
            
            next();

       
       
})

module.exports={verifyJwt}