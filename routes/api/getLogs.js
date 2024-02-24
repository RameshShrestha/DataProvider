const express = require('express');
const router = express.Router();
const { verifyJWT, getLoggedInUserOrIgnore } = require("../../middlewares/AuthHandler");
const { userLogs } = require("../../DB/MongoModels/userLoggerModel");
router.route("/iplogs").get(verifyJWT, async(req, res) => {
    let _skip = Number(req.query.skip) || 0;
    let _limit = Number(req.query.limit) || 1000;
    let _filterIP = req.query.ip;
    let _filterPath = req.query.path;
    let _filterCreatedAt = req.query.createdAt;
    try {
        res.setHeader('Content-Type', 'application/json');
        let filters ={};
        if(_filterIP){
            filters.ip = { "$regex": _filterIP, "$options": "i" };
        }
        if(_filterPath){
            filters.path = { "$regex": _filterPath, "$options": "i" };
        }
        if(_filterCreatedAt){
           // filters.createdAt =_filterCreatedAt;
            console.log("date filter " , _filterCreatedAt);
            let dates = _filterCreatedAt.split("-");
            let startDate =  new Date(dates[0]);
            let endDate = new Date(dates[1]);//end of that day
            endDate.setDate(endDate.getDate() + 1);
            filters.createdAt = { $gte:startDate, $lte:endDate  }
        }
       let totalRecords =  await userLogs.countDocuments({});

        userLogs.find(filters).skip(_skip).limit(_limit).sort({'createdAt':'desc'}).then(function (logs) {
            res.send({ logs: logs, total : totalRecords });
        });
    } catch (error) {
        res.send(error);
    }
});
module.exports = router;

