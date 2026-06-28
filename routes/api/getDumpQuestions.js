const express = require('express');
const router = express.Router();
const path = require('path');
const { dumpQuestions } = require("../../DB/MongoModels/DumpQuestionsModel");
const { verifyJWT, getLoggedInUserOrIgnore } = require("../../middlewares/AuthHandler");
router.route("/").get(async (req, res) => {
  let result = "";
  // req.user ="ramesh"//
  // console.log("calling user " ,req.user);
  // if(req.user){


  dumpQuestions.find().then(function (data) {
    console.log("Fetching dump questions"); // Success
    res.json({ dumpQuestions: data });
  }).catch(function (error) {
    console.log(error); // Failure
    result = result + " \n Data deleted Registered";
    res.send(result);
  });
  //   }else{
  //     res.send({message:"User not valid"});
  //   }
});
router.route("/:_id").get( async (req, res) => {
    //let lat = req.query.lat;
    let questionId =  req.params._id;
  //  console.log("questionId  ", questionId);
    try {
        res.setHeader('Content-Type', 'application/json');
        dumpQuestions.findById(questionId).then(function (question) {
            res.send(question);
        });
    } catch (error) {
        res.status(500).send(error);
    }
});

router.route("/addquestions").post(async (req, res) => {
  const { category, questionType, questionText, correctAnswersCount, answerOptions } = req.body;
  let result = "";


  try {
    const dumpQuestion = await dumpQuestions.create({
      category,
      questionType,
      questionText,
      createdBy: "ramesh",
      correctAnswersCount,
      answerOptions

    });
    res.json({ message: "Added Successfully", item: { "fromDB": dumpQuestion,"payload":req.body }});
  } catch (error) {
    console.log(error);
    result = error.toString();
    res.send(result);
  }
});
router.route("/removeItem/:id").delete(async (req, res) => {
  let id = req.params.id;

  try {
    let result = await dumpQuestions.deleteOne({ _id: id });
    res.json({ message: "Deleted Successfully", ...result });
  } catch (error) {
    console.log(error);
    result = error.toString();
    res.send(result);
  }
});
router.route("/updateItem/:id").put(async (req, res) => {
  let id = req.params.id;
  const { category,questionType, questionText, correctAnswersCount, answerOptions } = req.body;

  try {
    let result = await dumpQuestions.findByIdAndUpdate(id, {category, questionType, questionText, correctAnswersCount, answerOptions });
    res.json({ message: "Updated Successfully", result });
  } catch (error) {
    console.log(error);
    result = error.toString();
    res.send(result);
  }
});
module.exports = router;