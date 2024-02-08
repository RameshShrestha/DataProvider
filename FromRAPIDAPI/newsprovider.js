const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
let newsData = require('./newsCopy.json');
//const { ToDoList } = require("../../DB/MongoModels/ToDoListModel");
router.route("/").get(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const news = newsData.data.main.stream;
    const newsContent = news.map((item)=>{
        return item.content;
    });
    res.json({news: newsContent});
   
  });
  

  module.exports = router;