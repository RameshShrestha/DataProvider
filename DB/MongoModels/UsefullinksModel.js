const mongoose = require('mongoose');

const usefulLinksSchema = new mongoose.Schema(

    {
        type: {
            type: String,
        },

        url: {
            type: String,
        },
        description: {
            type: String,
        },
        username: {
            type: String,
        }

    },
    { timestamps: true }
);

const UsefulLinks = mongoose.model("UsefulLinks", usefulLinksSchema);
module.exports = { UsefulLinks };
