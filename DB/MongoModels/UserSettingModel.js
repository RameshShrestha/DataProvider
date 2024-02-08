const mongoose = require('mongoose');
const RegisteredUser = require("./RegisteredUserModel");
const userSettingSchema = new mongoose.Schema(
    {
        defaultLanguage: {
            type: String,
            default: "En",
        },
        theme: {
            type: String,
            default: "sap_fiori_3",
        },
        showNotification: {
            type: Boolean,
            default: true,
        },
        showWeatherCard: {
            type: Boolean,
            default: true,
        },
        showProductCard: {
            type: Boolean,
            default: true,
        },
        showMyActivityCard: {
            type: Boolean,
            default: true,
        },
        showStockPriceCard: {
            type: Boolean,
            default: true,
        },
        username: {
            type:String,
            default :"",
            unique: true,
        },
        userid: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RegisteredUser",
            unique: true,
        },
    },
    { timestamps: true }
);
const UserSetting = mongoose.model("UserSetting", userSettingSchema);
module.exports = { UserSetting };