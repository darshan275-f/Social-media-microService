const express = require("express");
const { loginUser, logOutUser, refreshAccessToken, registerUser } = require("../controllers/user.controller.js");
const { verifyJwt } = require("../middleware/auth.middleware.js");

const router = express.Router();

router.route("/register").post(registerUser);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJwt,logOutUser);

router.route("/refresh-token").post(refreshAccessToken);

module.exports=router;