const mongoose = require('mongoose');
// TODO: Add image and pdf file sharing in the next version
const NotificationsSchema = new mongoose.Schema(
    {
        title: {
            type: String,
        },
        message: {
            type: String,
        },
        type: {
            type: String,
        },
        from_user :{
            type :String,
        },
        to_user: {
            type: String,
        },
       

    },
    { timestamps: true }
);

const Notifications = mongoose.model("Notifications", NotificationsSchema);
module.exports = { Notifications };
