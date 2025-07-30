const { User } = require("../models/user.model.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { asynchandler } = require("../utils/asynchandler.js");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger.util.js");

let generateAccessAndRefreshToken = async (userid) => {
    try {
        logger.info("Generating access and refresh token for user: " + userid);
        let user = await User.findById(userid);
        let newAccessToken = user.generateAccessToken();
        let newRefreshToken = user.GenerateRefreshToken();
        user.refreshToken = newRefreshToken;
        await user.save({ validateBeforeSave: false });
        logger.info("Successfully generated tokens for user: " + userid);
        return { newAccessToken, newRefreshToken };
    } catch (error) {
        logger.warn("Something went wrong while Generating Token: " + error);
        throw new ApiError("Something went wrong while Generating Token" + error, 500);
    }
};

let registerUser = asynchandler(async function (req, res) {
    logger.info("register endpoint hit....");

    const { userName, email, password } = req.body;
    if ([userName, email, password].some((ele) => ele?.trim() === "")) {
        logger.warn("Fields should not be empty");
        throw new ApiError("Fields should not be empty", 400);
    }

    const alreadyExist = await User.findOne({ $or: [{ email }, { userName }] });
    if (alreadyExist) {
        logger.warn("The user already Exist");
        throw new ApiError("The user already Exist", 400);
    }

    const user = await User.create({
        userName,
        email,
        password,
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) {
        logger.error("Failed to retrieve created user after registration");
        throw new ApiError("Something went wrong while registering user", 500);
    }

    logger.info("User registered successfully: " + createdUser._id);
    res.status(200).json(new ApiResponse(200, "Success", createdUser));
});

let loginUser = asynchandler(async (req, res) => {
    logger.info("login endpoint hit....");

    let { email, userName, password } = req.body;
    if (!email && !userName) {
        logger.warn("Email or userName is Empty");
        throw new ApiError("Email or userName is Empty", 400);
    }

    const user = await User.findOne({ $or: [{ email }, { userName }] });
    if (!user) {
        logger.warn("User not found, must register first");
        throw new ApiError("You need to sign in first", 400);
    }

    let passwordCheck = await user.isPasswordCorrect(password);
    if (!passwordCheck) {
        logger.warn("Invalid Password for user: " + user._id);
        throw new ApiError("Invalid Passowrd", 400);
    }

    let { newAccessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    let options = {
        httpOnly: true,
        secure: true,
    };

    logger.info("User logged in successfully: " + user._id);
    return res
        .status(200)
        .cookie("accessToken", newAccessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200, "Logged in successfully", {
                user: loggedInUser,
                newAccessToken,
                newRefreshToken,
            })
        );
});

let logOutUser = asynchandler(async (req, res) => {
    logger.info("logout endpoint hit for user: " + req.user._id);

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refreshToken: undefined },
        },
        {
            new: true,
        }
    );

    let options = {
        httpOnly: true,
        secure: true,
    };

    logger.info("User logged out: " + req.user._id);
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, "Logged out successfully", {}));
});

const refreshAccessToken = asynchandler(async (req, res) => {
    logger.info("refresh token endpoint hit...");

    let incomingRefreshToken = req.cookies?.refreshToken;
    if (!incomingRefreshToken) {
        logger.warn("Unauthorized access - no refresh token");
        throw new ApiError("Unauthrozied Access", 400);
    }

    let decodedrefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    try {
        let user = await User.findById(decodedrefreshToken?._id);
        if (!user) {
            logger.warn("Refresh token invalid: user not found");
            throw new ApiError("Invalid refresh token", 401);
        }

        if (user?.refreshToken !== incomingRefreshToken) {
            logger.warn("Refresh token mismatch for user: " + user._id);
            throw new ApiError("The Token is expired or incorrect", 401);
        }

        let { newAccessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id);

        let options = {
            httpOnly: true,
            secure: true,
        };

        logger.info("Refresh token successful for user: " + user._id);
        res
            .status(200)
            .cookie("refreshToken", newRefreshToken, options)
            .cookie("accessToken", newAccessToken, options)
            .json(
                new ApiResponse(200, "Refreshed successfully!!", {
                    newAccessToken,
                    refreshToken: newRefreshToken,
                })
            );
    } catch (error) {
        logger.error("Error while refreshing token: " + error);
        throw new ApiError("Something went wrong while refreshing token!" + error, 500);
    }
});

module.exports = {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
};
