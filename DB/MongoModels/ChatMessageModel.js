const mongoose   = require('mongoose');
// TODO: Add image and pdf file sharing in the next version
const chatMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
    },
    receiver: {
      type: String,
    },
    content: {
      type: String,
    },
    seen :{
      type :Boolean,
      default : false,
    }
  },
  { timestamps: true }
);

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
module.exports = {ChatMessage};
