const express=require("express");
const { createPost } = require("../controllers/post.controller");
const Router=express.Router();
const {verifyJwt}=require("../middlewares/auth.middleware.js")

Router.route("/createPost").post(verifyJwt,createPost);

module.exports=Router;