const bcrypt = require("bcrypt");
const crypto = ("crypto");
const jwt = require("jsonwebtoken") ;
const mongoose   = require('mongoose');
const { UserProfile } = require ("./UserProfileModel");
const  {DB_NAME}  =require("../../Constants");
const { UserSetting } = require("./UserSettingModel");

const userSchema = new mongoose.Schema(
  {
    avatar: {
      type: {
        url: String,
        localPath: String,
      },
      default: {
        url: `https://via.placeholder.com/200x200.png`,
        localPath: "",
      },
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["ADMIN","USER"],
      default: "USER",
      required: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },
    forgotPasswordToken: {
      type: String,
    },
    forgotPasswordExpiry: {
      type: Date,
    },
    emailVerificationToken: {
      type: String,
    },
    emailVerificationExpiry: {
      type: Date,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.post("save", async function (user, next) {
  // ! Generally, querying data on every user save is not a good idea and not necessary when you are working on a specific application which has concrete models which are tightly coupled
  // ! However, in this application this user model is being referenced in many loosely coupled models so we need to do some initial setups before proceeding to make sure the data consistency and integrity
  const userprofile = await UserProfile.findOne({ userid: user._id });
  // Setup necessary ecommerce models for the user
  try{
  if (!userprofile) {
    console.log("User Not there , Profile is create action triggered");
    await UserProfile.create({
      userid: user._id,
      username : user.username,
      email : user.email,
      role : user.role
    });
  }
  else{
   // console.log("User Already there so no Profile is created");
  }
}
catch(error){
  console.log("UserProfile Create Error" , error);
}

const userSetting= await UserSetting.findOne({ userid: user._id });
// Setup necessary ecommerce models for the user
try{
if (!userSetting) {
  console.log("User Setting not there , Setting is created create action triggered");
  await UserSetting.create({
    userid: user._id,
    username: user.username,
  });
}
else{
 // console.log("User Already there so no Setting is created");
}
}
catch(error){
console.log("UserSetting Create Error" , error);
}

  next();
});



userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};


 const RegisteredUser = mongoose.model("RegisteredUser", userSchema);
module.exports = {RegisteredUser};