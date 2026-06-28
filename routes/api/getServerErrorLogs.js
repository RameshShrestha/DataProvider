const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
router.route("/").get( async (req, res) => {
    try {
            const serverErrorFilePath = path.resolve(__dirname,'..', '..','DB', 'LocalDataProvider', 'ServerErrorLog.txt');
    //      let fileData = fs.readFileSync("./DB/LocalDataProvider/ServerErrorLog.txt");
    //     res.setHeader('Content-Type', 'text/plain');
    //    res.send(fileData);


        fs.readFile(serverErrorFilePath, 'utf8', (err, data) => {
         if (err) {
           return res.status(500).send('Error reading file');
         }
         res.setHeader('Content-Type', 'application/json');
        res.send({data: data});
       });
    //res.send("Server Error status will be included here");
    } catch (error) {
        res.status(500).send(error.toString());
    }
});
module.exports = router;