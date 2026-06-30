const express = require('express');
const router = express.Router();
const path = require('path');
const { dumpQuestions } = require("../../DB/MongoModels/DumpQuestionsModel");
const { verifyJWT, getLoggedInUserOrIgnore } = require("../../middlewares/AuthHandler");
router.route("/").get(verifyJWT,async (req, res) => {
  try {
    let userId = "";
     if(req.user){
      userId =req.user.username;
     }
     console.log("fetching Data for user : ",userId);

    // Extract pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Extract filter parameters
    const filters = {};
    
    // Always filter by logged-in user
    if (userId) {
      filters.createdBy = userId;
    }
    
    if (req.query.category) {
      filters.category = req.query.category;
    }
    if (req.query.questionType) {
      filters.questionType = req.query.questionType;
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
   // console.log(error);
    res.status(500).json({
      error: "Failed to fetch dump questions",
      message: error.message
    });
  }
});

router.route("/category").get(async (req, res) => {
  try {
    // Get unique categories from the database
    const categories = await dumpQuestions.distinct("category");
    
    res.json({
      categories: categories,
      count: categories.length
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "Failed to fetch categories",
      message: error.message
    });
  }
});

router.route("/takequiz").get(verifyJWT, async (req, res) => {
  try {
    const { user, category } = req.query;

    // Validate required parameters
    if (!category) {
      return res.status(400).json({
        error: "Category parameter is required"
      });
    }

    // Build filter
    const filters = { category };

    // Get total count for the category
    const totalCount = await dumpQuestions.countDocuments(filters);

    // Fetch 20 random questions from the category
    const questions = await dumpQuestions.aggregate([
      { $match: filters },
      { $sample: { size: Math.min(20, totalCount) } }
    ]);

    res.json({
      user: user || "anonymous",
      category: category,
      totalQuestionsInCategory: totalCount,
      questionsProvided: questions.length,
      questions: questions
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "Failed to fetch quiz questions",
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

router.route("/addquestions").post(verifyJWT,async (req, res) => {
     let userId = "";
     if(req.user){
      userId =req.user.username;
     }
  const { category, questionType, questionText, correctAnswersCount, answerOptions } = req.body;
  let result = "";


  try {
    const dumpQuestion = await dumpQuestions.create({
      category,
      questionType,
      questionText,
      createdBy: userId,
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
router.route("/removeItem/:id").delete(verifyJWT, async (req, res) => {
  let id = req.params.id;
  let userId = "";
     if(req.user){
      userId =req.user.username;
     }
  try {
    let result = await dumpQuestions.deleteOne({ _id: id ,createdBy: userId });
    res.json({ message: "Deleted Successfully", ...result });
  } catch (error) {
    console.log(error.message);
    result = error.toString();
    res.send(result);
  }
});
router.route("/updateItem/:id").put(verifyJWT, async (req, res) => {
  let id = req.params.id;
  const { category,questionType, questionText, correctAnswersCount, answerOptions } = req.body;

  try {
    let result = await dumpQuestions.findByIdAndUpdate(id, {category, questionType, questionText, correctAnswersCount, answerOptions });
    res.json({ message: "Updated Successfully", result });
  } catch (error) {
    console.log(error.message);
    result = error.toString();
    res.send(result);
  }
});

module.exports = router;