const mongoose = require('mongoose');

const userLoggerSchema = new mongoose.Schema(

    {
        hostname: {
            type: String,
        },

        ip: {
            type: String,
        },
        path: {
            type: String,
        }

    },
    { timestamps: true }
);

const userLogs = mongoose.model("userLogs", userLoggerSchema);
module.exports = { userLogs };
