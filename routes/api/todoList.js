const express = require('express');
const router = express.Router();
const path = require('path');
const { ToDoList } = require("../../DB/MongoModels/ToDoListModel");
const  {verifyJWT,getLoggedInUserOrIgnore } = require("../../middlewares/AuthHandler");
router.route("/getList").get(verifyJWT,async (req, res) => {
    let result = "";
    console.log("calling user " ,req.user);
    if(req.user){

    
    ToDoList.find({username:req.user.username}).then(function (data) {
     console.log("Fetching To do list of User"); // Success
     res.json({todoList : data});
    }).catch(function (error) {
      console.log(error); // Failure
      result = result + " \n Data deleted Registered";
      res.send(result);
    });
  }else{
    res.send({message:"User not valid"});
  }
  });
  router.route("/addTodoList").post(async (req, res) => {
    const { title, content, targetCompletionDate,status,username ,complitionPercent} = req.body;
    let result = "";
    try{
    const todoItem = await ToDoList.create({
        title,
        content,
        username,
        targetCompletionDate,
        complitionPercent,
        status
      });
      res.json({message:"Added Successfully",item :todoItem});
    }catch( error) {
      console.log(error); 
      result = error.toString();
      res.send(result);
    }
  });
  router.route("/removeItem/:id").delete(async (req, res) => {
    let id = req.params.id;
    
    try{
    let result= await ToDoList.deleteOne({_id : id});
      res.json({message:"Deleted Successfully",...result});
    }catch( error) {
      console.log(error); 
      result = error.toString();
      res.send(result);
    }
  });
  router.route("/updateItem/:id").put(async (req, res) => {
    let id = req.params.id;
    const { title, content, targetCompletionDate,status,username ,complitionPercent} = req.body;

    try{
    let result= await ToDoList.findByIdAndUpdate(id,{content,status,complitionPercent});
      res.json({message:"Updated Successfully",result});
    }catch( error) {
      console.log(error); 
      result = error.toString();
      res.send(result);
    }
  });
  module.exports = router;