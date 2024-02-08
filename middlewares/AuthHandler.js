//import { AvailableUserRoles } from "../constants.js";
const { RegisteredUser } = require("../DB/MongoModels/RegisteredUserModel");
//import { ApiError } from "../utils/ApiError.js";
//import { asyncHandler } from "../utils/asyncHandler.js";
const jwt = require("jsonwebtoken");

 const verifyJWT = async (req, res, next) => {
  // console.log("Cookies",req.cookies);
  //  console.log("Authorization",req.header("Authorization"));
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      //  console.log("Unauthorized token");
        res.status(406).send({message:"No Authorization token",token:req.cookies?.accessToken|| "no token"});
        return;
      //  throw ("Unauthorized request");
    }

    try {
        
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log("decodedToken",decodedToken);
        RegisteredUser.findById
        const user = await RegisteredUser.findById(decodedToken?._id).select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
        );
        if (!user) {
            // Client should make a request to /api/v1/users/refresh-token if they have refreshToken present in their cookie
            // Then they will get a new access token which will allow them to refresh the access token without logging out the user
            // throw new ApiError(401, "Invalid access token");
            console.log("Unauthorized token for user");
            res.status(406).send({message:"Unauthorized token for user",token:decodedToken});
           // throw ("Invalid access token");
        }
        req.user = user;
        next();
    } catch (error) {
        // Client should make a request to /api/v1/users/refresh-token if they have refreshToken present in their cookie
        // Then they will get a new access token which will allow them to refresh the access token without logging out the user
        //throw new ApiError(401, error?.message || "Invalid access token");
       // throw (error?.message || "Invalid access token");
       console.log(error);
       res.status(406).send({message :"Error",error : error});
    }
};

/**
 *
 * @description Middleware to check logged in users for unprotected routes. The function will set the logged in user to the request object and, if no user is logged in, it will silently fail.
 *
 * `NOTE: THIS MIDDLEWARE IS ONLY TO BE USED FOR UNPROTECTED ROUTES IN WHICH THE LOGGED IN USER'S INFORMATION IS NEEDED`
 */
 const getLoggedInUserOrIgnore = async (req, res, next) => {
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await RegisteredUser.findById(decodedToken?._id).select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
        );
        req.user = user;
        next();
    } catch (error) {
        // Fail silently with req.user being falsy
        next();
    }
};

/**
 * @param {AvailableUserRoles} roles
 * @description
 * * This middleware is responsible for validating multiple user role permissions at a time.
 * * So, in future if we have a route which can be accessible by multiple roles, we can achieve that with this middleware
 */
 const verifyPermission = (roles) =>
    async (req, res, next) => {
        if (!req.user?._id) {
            //throw new ApiError(401, "Unauthorized request");
            throw("Unauthorized request");
        }
        if (roles.includes(req.user?.role)) {
            next();
        } else {
           // throw new ApiError(403, "You are not allowed to perform this action");
            throw ("You are not allowed to perform this action");
        }
    };

 const avoidInProduction = async (req, res, next) => {
    if (process.env.NODE_ENV === "development") {
        next();
    } else {
        // throw new ApiError(
        //     403,
        //     "This service is only available in the local environment. For more details visit: https://github.com/hiteshchoudhary/apihub/#readme"
        // );
        throw("Do not use in Production");
    }
};


module.exports = {verifyJWT,getLoggedInUserOrIgnore,verifyPermission,avoidInProduction}