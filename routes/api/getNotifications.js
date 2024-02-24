const express = require('express');
const router = express.Router();
const { verifyJWT, getLoggedInUserOrIgnore } = require("../../middlewares/AuthHandler");
const { Notifications } = require("../../DB/MongoModels/NotificationModel");
router.route("/").get(verifyJWT, async (req, res) => {
    let _skip = Number(req.query.skip) || 0;
    let _limit = Number(req.query.limit) || 100;
    let user = req.user.username;
    try {
        res.setHeader('Content-Type', 'application/json');
        let filters = {
            $or: [
                { to_user: "AllUsers"},{ to_user: user }
              ]
            }
      //  console.log("user : " ,user);
        
        let totalRecords = await Notifications.countDocuments({});
        Notifications.find(filters).skip(_skip).limit(_limit).sort({ 'createdAt': 'desc' }).then(function (notifications) {
            res.send({ notifications: notifications, total: totalRecords });
        });
    } catch (error) {
        res.status(500).send(error.toString());
    }
});
router.route("/:id").delete(verifyJWT, async (req, res) => {
    let _skip = Number(req.query.skip) || 0;
    let _limit = Number(req.query.limit) || 100;
    let user = req.user.username;
    let id = req.params.id;
    try {
        let notificationToDelete = await RegisteredUser.findById(id).exec();
        if (notificationToDelete.to_user === user) {
            let result = await Notifications.deleteOne({ _id: id });
            res.json({ message: "Sucessfully Deleted", ...result });
        }else{
            res.status(401).json({ message: "Unauthorized to Delete" });
        }

    } catch (error) {
        console.log(error);
        result = error.toString();
        res.send(result);
    }
});
module.exports = router;

