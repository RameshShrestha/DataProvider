const express = require('express');
const router = express.Router();
const path = require('path');
const { Message } = require("../../DB/MongoModels/MessageModel");
const  {verifyJWT,getLoggedInUserOrIgnore } = require("../../middlewares/AuthHandler");
router.route("/getMessages").get(verifyJWT,async (req, res) => {
    let result = "";
    console.log("calling user " ,req.user);
    if(req.user){
        Message.find().then(function (data) {
     console.log("Fetching To do list of User"); // Success
     res.json({messages : data});
    }).catch(function (error) {
      console.log(error); 
      res.send(result);
    });
  }else{
    res.send({message:"User not valid"});
  }
  });
//Mark read  
router.route("/markRead/:id").put(verifyJWT, async (req, res) => {
  let id = req.params.id;
  res.setHeader('Content-Type', 'application/json');
  console.log("id :",id);
  try{
      let result= await Message.findOneAndUpdate({_id : id},{status:""});
        res.json({message:"Marked as Read"});
      }catch( error) {
        console.log(error); 
        result = error.toString();
        res.send(result);
      }
});


//Delete  Useful link
router.route("/deleteMessage/:id").delete(verifyJWT, async (req, res) => {
  let id = req.params.id;
  res.setHeader('Content-Type', 'application/json');
  console.log("id :",id);
  try{
      let result= await Message.deleteOne({_id : id});
        res.json({message:"Deleted Successfully",...result});
      }catch( error) {
        console.log(error); 
        result = error.toString();
        res.send(result);
      }
});
  router.route("/sendMessageToAdmin").post(async (req, res) => {
    const { name, address, mailid,message} = req.body;
    let result = "";
    try{
    const userMessage = await Message.create({
        name,
        address,
        mailid,
        message,
        status:"New"
      });
      res.json({message:"Message Sent Successfully",item :userMessage});
    }catch( error) {
      console.log(error); 
      result = error.toString();
      res.send(result);
    }
  });
  module.exports = router;