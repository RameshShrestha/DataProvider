const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken") ;
const path = require('path');
const fs = require('fs');
let data = require('../../users.json');
const { RegisteredUser } = require("../../DB/MongoModels/RegisteredUserModel");
const { UserProfile } = require("../../DB/MongoModels/UserProfileModel");
const { ChatMessage } = require("../../DB/MongoModels/ChatMessageModel");
const e = require('express');
const { ApiError } = require('../../Utils/APIError');
const { compareSync } = require('bcrypt');
const { verifyJWT, getLoggedInUserOrIgnore } = require("../../middlewares/AuthHandler");
const { Console } = require('console');

module.exports = function (usersStatus) {
  const localUser = [{
    "_id": { "$oid": "659fca42f56fad20b76e2eea" },
    "avatar": {
      "url": "https://via.placeholder.com/200x200.png",
      "localPath": "", "_id": { "$oid": "659fca42f56fad20b76e2ee9" }
    },
    "username": "ramesh",
    "email": "ramesh@test.com",
    "role": "ADMIN",
    "password": "$2b$10$K9c0PZUXhhd9.uHLt.nNAOVWRBYhxqgN4vWFjrKwfOOcVA.fP00Fe",
    "isEmailVerified": false,
    "createdAt": { "$date": { "$numberLong": "1704970818529" } },
    "updatedAt": { "$date": { "$numberLong": "1706587811399" } },
    "__v": { "$numberInt": "0" },
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NTlmY2E0MmY1NmZhZDIwYjc2ZTJlZWEiLCJpYXQiOjE3MDY1ODc4MTEsImV4cCI6MTcwNzQ1MTgxMX0.VarvWuSdnNEw0HPWIRatGEdcOt0Tpkwckw0lYsVkhTo"
  }]
  router.route("/resetAllUsers").get(verifyJWT, async (req, res) => {
    let result = "";
    UserProfile.deleteMany({}).then(function () {
      console.log("Data deleted Profile"); // Success
      result = result + "\n Data deleted Profile";

    }).catch(function (error) {
      console.log(error); // Failure
    });
    RegisteredUser.deleteMany({}).then(function () {
      console.log("Data deleted registered"); // Success
    }).catch(function (error) {
      console.log(error); // Failure
      result = result + " \n Data deleted Registered";
      res.send(result);
    });
  });
  router.route("/resetAllChats").get(verifyJWT, async (req, res) => {
    let result = "";
    ChatMessage.deleteMany({}).then(function () {
      console.log("Data deleted Chats"); // Success
      result = result + "\n Data deleted Profile";
      res.send(result);
    }).catch(function (error) {
      console.log(error); // Failure
    });

  });
  router.route("/registerdUser").get(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    RegisteredUser.find({}).then(function (users) {
      res.send({ users: users });

    });
  });
  router.route("/").get(verifyJWT, async (req, res) => {
    if (Object.keys(req.query).length === 0) {
      res.setHeader('Content-Type', 'application/json');
      UserProfile.find({}).then(function (users) {
        res.send({ users: users });
        return;
      });
    } else {
      let query = {};
      if (req.query.firstName) {
        query.firstName = { "$regex": req.query.firstName, "$options": 'i' }
      }
      if (req.query.lastName) {
        query.lastName = { "$regex": req.query.lastName, "$options": 'i' }
      }
      if (req.query.userId) {
        query.username = { "$regex": req.query.userId, "$options": 'i' }
      }
      if (req.query.age) {
        query.age = req.query.age
      }
      let skip = Number(req.query.skip || 0);
      let limit = Number(req.query.limit || 10);

      res.setHeader('Content-Type', 'application/json');
      UserProfile.find(query).then(function (users) {
        res.send({
          users: users.slice(skip, (limit + skip)), "total": users.length,
          skip: Number(skip), limit: limit
        });
        return;
      });
    }


  });


  router.route("/:id").get(verifyJWT, async (req, res) => {
    let id = req.params.id;
    
   // console.log("session user :", req.user);
    let requestedUser = id ;
    if(requestedUser ==="nouser"){
      requestedUser =  req.user.username;
    }
    //console.log("Parameter user :", id);
    if (requestedUser) {
      res.setHeader('Content-Type', 'application/json');
      try {
       // console.log("requestedUser",requestedUser);
        const existedUser = await UserProfile.findOne({ username: requestedUser});
        if (existedUser) {
           // console.log("Existing user Found");
          res.send(existedUser);

          return;
        } else {
          res.send("User not found here");
        }

      } catch (error) {
        console.log(error);
        res.send({ "status": "Error", error: error });
      }
      //  res.send(productfile);
    } else {
      res.send("Invalid Id Provided");
    }
  });
  //Create New User
  router.route("/createUser").post(async (req, res, next) => {
    const { email, username, password, role } = req.body;
    try {


      const existedUser = await RegisteredUser.findOne({
        $or: [{ username }, { email }],
      });

      if (existedUser) {
      //  console.log("came from existing user");
        res.send(existedUser);

        return;
      }
      const user = await RegisteredUser.create({
        email,
        password,
        username,
        isEmailVerified: false,
        role: role || "USER" //["ADMIN","USER"],
      });
     // console.log("51", user);
      // await RegisteredUser.save({ validateBeforeSave: false });
      const createdUser = await RegisteredUser.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
      );

      if (!createdUser) {
        throw ("Something went wrong while registering the user");
      }
     // console.log(createdUser);
      return res
        .status(201)
        .json({ user: createdUser, message: "Registered Successfully" });
    } catch (e) {
      console.log(e);
      res.send(e);
    }

  });

  //Handle Login
  router.route("/login").post(async (req, res, next) => {
   // console.log("usersStatus", usersStatus);
    const { email, username, password, role } = req.body;
    try {

      if (usersStatus?.dbConnected) {


        const loginUser = await RegisteredUser.findOne({
          $or: [{ username }, { email }],
        });

        if (!loginUser) {
          console.log("Invalid User Id");

          // throw ({code:"409", message: "User Id does not exists"});
          res.status(409).json({ "status": "Failed", "message": "User Id does not exists" });
          return;
        }
        // Compare the incoming password with hashed password
        const isPasswordValid = await loginUser.isPasswordCorrect(password);

        if (!isPasswordValid) {
          // throw ({code:"401", message: "Invalid user credentials"});
          res.status(401).json({ "status": "Failed", "message": "Invalid user credentials" });
          return;
        }
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
          loginUser._id
        );
        //console.log(accessToken,refreshToken);
        // get the user document ignoring the password and refreshToken field
        const loggedInUser = await RegisteredUser.findById(loginUser._id).select(
          "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
        );


        // TODO: Add more options to make cookie more secure and reliable
        const options = {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production"
        };
        //console.log("sent cookies", accessToken,refreshToken);
        res.status(200)
          .cookie("accessToken", accessToken, options) // set the access token in the cookie
          .cookie("refreshToken", refreshToken, options) // set the refresh token in the cookie
          .json({ user: loggedInUser, message: "Logged in successfully", statusCode: 200, success: true, accessToken:accessToken,refreshToken:refreshToken });
        return;

      } else {
        //DB is not connected
          if(username ==="ramesh" && password ==="ramesh"){
            const { accessToken, refreshToken } =  generateAccessAndRefreshTokensLocal(
              username
            );
            const options = {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production"
            };
            res.status(200)
            .cookie("accessToken", accessToken, options) // set the access token in the cookie
            .cookie("refreshToken", refreshToken, options) // set the refresh token in the cookie
            .json({ user: localUser[0], message: "Logged in successfully", statusCode: 200, success: true });
          return;
          }

        console.log("DB not connected");
        res.status(500).json({message:"DB not connected"});
      }
    } catch (e) {
      console.log(e);
      res.json({ "error": e, "message": "Error while processing" });
    }

  });

  //Handle Login
  router.route("/logout").post(verifyJWT, getLoggedInUserOrIgnore, async (req, res, next) => {
    await RegisteredUser.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken: undefined,
        },
      },
      { new: true }
    );

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json({ message: "User logged out" });
  });
  //Update Record
  router.route("/:id").put(verifyJWT, async (req, res) => {
    let id = req.params.id;
    let updatedUserData = req.body;
    if (id) {
      res.setHeader('Content-Type', 'application/json');
      let docs = await UserProfile.findOneAndUpdate({ username: id }, updatedUserData);
      docs = await UserProfile.findOne({ username: id });
      res.send({ message: "Updated Successfully", data: docs });
    }
  });


  router.route("/:id").delete(verifyJWT, (req, res) => {
    let id = req.params.id;
    res.setHeader('Content-Type', 'application/json');
    const usersCopy = [...data.users];
    const userIndex = usersCopy.findIndex(user => user.id == id);
    if (userIndex < 0) {
      res.send("No such User found");
    } else {
      usersCopy.splice(userIndex, 1);

      const recordTobeDeleted = usersCopy[userIndex];
      const finalData = { "users": usersCopy, total: usersCopy.length };
      const jsonString = JSON.stringify(finalData);
      fs.writeFileSync('./users.json', jsonString)
      res.send({ message: "Removed Successfully", data: recordTobeDeleted });
    }

  });


  const refreshAccessToken = async (req, res) => {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }

    try {
      const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      const user = await RegisteredUser.findById(decodedToken?._id);
      if (!user) {
        throw new ApiError(401, "Invalid refresh token");
      }

      // check if incoming refresh token is same as the refresh token attached in the user document
      // This shows that the refresh token is used or not
      // Once it is used, we are replacing it with new refresh token below
      if (incomingRefreshToken !== user?.refreshToken) {
        // If token is valid but is used already
        throw new ApiError(401, "Refresh token is expired or used");
      }
      const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      };

      const { accessToken, refreshToken: newRefreshToken } =
        await generateAccessAndRefreshTokens(user._id);

      return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json({ accessToken, refreshToken: newRefreshToken, message: "Token Refreshed" });
    } catch (error) {
      throw new ApiError(401, error?.message || "Invalid refresh token");
    }
  };
  router.route("/refresh-token").post(refreshAccessToken);

  const generateAccessAndRefreshTokensLocal = ( username) => {
    const accessToken = jwt.sign(
      {
        username: username,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      {
        username: username,
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
    return { accessToken, refreshToken };
  }




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

  return router;
}
