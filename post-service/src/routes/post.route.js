const express=require("express");
const { createPost, getAllPosts, getPost, deletePost } = require("../controllers/post.controller");
const Router=express.Router();
const {verifyJwt}=require("../middlewares/auth.middleware.js")

Router.route("/createPost").post(verifyJwt,createPost);
Router.route("/getAllPosts").get(verifyJwt,getAllPosts);
Router.route("/getPost/:id").get(verifyJwt,getPost);
Router.route("/delete/:id").delete(verifyJwt,deletePost);

module.exports=Router;