/*
Register users loggedin using social media like google and github
*/
const { ApiError } = require('../Utils/APIError');
const { RegisteredUser } = require("../DB/MongoModels/RegisteredUserModel");
const path = require('path');
const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production"
};
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        //  console.log("userId inside Generate tokens" ,userId);
        const user = await RegisteredUser.findById(userId).exec();
        //  console.log(user);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // attach refresh token to the user document to avoid refreshing the access token with multiple refresh tokens
        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        console.log(error);
        throw new ApiError(
            500,
            "Something went wrong while generating the access token"
        );
    }
};
const loginwithGitHub = async (userdetail) => {
    let response = {};
    // let sampleUser = {
    //     "login": "RameshShrestha",
    //     "avatar_url": "https://avatars.githubusercontent.com/u/11848088?v=4",
    //     "name": "Ramesh Shrestha",
    //     "company": "Accenture Solutions",
    //     "blog": "https://www.linkedin.com/in/shrestharamesh",
    //     "location": "India",
    //     "email": "fx_ra@hotmail.com"
    // }
    try {
    if (!userdetail) {
       // throw ("User detail not available");
        response.status = "error";
        response.message = "User detail not available";
        return response;

    }
    const { email, login, password,avatar } = userdetail;
    

       
        const existedUser = await RegisteredUser.findOne({
            $or: [{ username: login }, { email }],
        });

        if (existedUser) {
            //  console.log("came from existing user, proceed with login");

            const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
                existedUser._id
            );
            response.status="ok";
            response.accessToken = accessToken;
            response.refreshToken = refreshToken;
            response.user =existedUser;
           
            return response;
        } else {
            //Register user first and proceed with login
            const user = await RegisteredUser.create({
                email,
                password: "test1234",
                username: login,
                isEmailVerified: true,
                avatar_url :avatar,
                role: "USER"
            });
            // console.log("51", user);
            // await RegisteredUser.save({ validateBeforeSave: false });
            const createdUser = await RegisteredUser.findById(user._id).select(
                "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
            );

            if (!createdUser) {
                throw ("Something went wrong while registering the user");
            }
            //set firstname and lastname based upon name from parameter in user profile

            const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
                createdUser._id
            );
            response.status="ok";
            response.accessToken = accessToken;
            response.refreshToken = refreshToken;
            response.user =createdUser;
           
            return response;
            // res.status(200)
            //     .cookie("accessToken", accessToken, options) // set the access token in the cookie
            //     .cookie("refreshToken", refreshToken, options) // set the refresh token in the cookie
            //     .json({ user: createdUser, message: "Logged in successfully", statusCode: 200, success: true, accessToken: accessToken, refreshToken: refreshToken });


            
        }
    } catch (e) {
        console.log(e);
      //  res.send(e);
        response.status = "error";
        response.message = e.message;
        return response;
    }

}
module.exports = { loginwithGitHub }