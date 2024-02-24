const mongoose = require('mongoose');
// TODO: Add image and pdf file sharing in the next version
const messageSchema = new mongoose.Schema(
    {
        name: {
            type: String,
        },

        address: {
            type: String,
        },
        mailid: {
            type: String,
        },
        message: {
            type: String,
        },
        status :{
            type : String,
        }
     

    },
    { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
module.exports = { Message };
