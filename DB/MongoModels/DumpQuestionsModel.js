const mongoose = require('mongoose');
// TODO: Add image and pdf file sharing in the next version

const dumpAnswersSchema = new mongoose.Schema(
    {
        answerIndex: {
            type: String,
        },
        answerText: {
            type: String,
        },
        isCorrect: {
            type: Boolean,
            default: false,
        },
        selected: {
            type: Boolean,
            default: false,
        },
    });
const dumpQuestionSchema = new mongoose.Schema(
    {
        category:{
            type:String,
        },
        questionId: {
            type: String,
        },

        questionType: {
            type: String,
        },
        questionText: {
            type: String,
        },
        correctAnswersCount: {
            type: Number,
        },
        answerOptions : [
            dumpAnswersSchema
        ],
        selectedAnswer: {
            type: String,
        },
        createdBy :{
            type :String
        },
        updatedBy :{
            type :String
        }

    },
    { timestamps: true }
    ,{strict:false}
);

const dumpQuestions = mongoose.model("dumpQuestions", dumpQuestionSchema);
module.exports = { dumpQuestions };

