const express = require('express');
const router = express.Router();
const path = require('path');
const { dumpQuestions } = require("../../DB/MongoModels/DumpQuestionsModel");
const { verifyJWT, getLoggedInUserOrIgnore } = require("../../middlewares/AuthHandler");
router.route("/").get(async (req, res) => {
  try {
    // Extract pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Extract filter parameters
    const filters = {};
    if (req.query.category) {
      filters.category = req.query.category;
    }
    if (req.query.questionType) {
      filters.questionType = req.query.questionType;
    }
    if (req.query.createdBy) {
      filters.createdBy = req.query.createdBy;
    }
    if (req.query.search) {
      filters.questionText = { $regex: req.query.search, $options: 'i' };
    }

    // Get total count for pagination metadata
    const totalCount = await dumpQuestions.countDocuments(filters);
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch paginated and filtered data
    const data = await dumpQuestions
      .find(filters)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    console.log("Fetching dump questions");
    
    res.json({
      dumpQuestions: data,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalCount: totalCount,
        limit: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "Failed to fetch dump questions",
      message: error.message
    });
  }
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