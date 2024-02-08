const { RegisteredUser } = require("../../DB/MongoModels/RegisteredUserModel");
const { UserProfile } = require("../../DB/MongoModels/UserProfileModel");
const getRegisteredUsers = async(isDBconnected)=>{
  try{

    if(isDBconnected){
    const existedUsers = await UserProfile.find({});
  //  console.log("All Users", existedUsers);
    return existedUsers;
  }else{
    //DB not connected
    return [];
  }
  }catch(err){
    console.log("Error fetching Users",err);
    return [];
  }
  }
  module.exports = getRegisteredUsers;