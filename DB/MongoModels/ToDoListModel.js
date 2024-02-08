const mongoose = require('mongoose');
// TODO: Add image and pdf file sharing in the next version
const todoListSchema = new mongoose.Schema(
    {
        title: {
            type: String,
        },

        content: {
            type: String,
        },
        username: {
            type: String,
        },
        status: {
            type: String,
        },
        targetCompletionDate: {
            type: Date,
        }

    },
    { timestamps: true }
);

const ToDoList = mongoose.model("ToDoList", todoListSchema);
module.exports = { ToDoList };
