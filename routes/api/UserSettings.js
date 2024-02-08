const express = require('express');
const router = express.Router();
const { UserSetting } = require("../../DB/MongoModels/UserSettingModel");
const { verifyJWT } = require("../../middlewares/AuthHandler");
router.route("/").get(verifyJWT, async (req, res) => {
  let username = req.user.username;
  console.log("username",username);
try{
  UserSetting.find({userid : req.user}).select(
    "-createdAt -updatedAt -userid -_id"
  ).then(function (setting) {
    res.send(setting);
  }).catch(function (error) {
    console.log(error); // Failure
    res.status(500).json({message:error});
  });
}catch(error){
    res.status(500).json({message:error});
}
});
router.route("/").put(verifyJWT, async (req, res) => {
  let username = req.user.username;
  let newSettingData = req.body;
  console.log("username :",username, newSettingData);
  try{
    if (username) {
      res.setHeader('Content-Type', 'application/json');
      let docs = await UserSetting.findOneAndUpdate({ username: username }, newSettingData);
      docs = await UserSetting.findOne({ username: username });
      res.status(200).send({ message: "Updated Successfully", data: docs });
    }
  }catch(error){
    console.log(error);
      res.status(500).json({message:error});
  }
  });
module.exports = router;