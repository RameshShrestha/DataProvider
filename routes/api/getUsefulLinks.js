const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");
const axios = require("axios");
const https = require('https');
const path = require('path');
const fs = require('fs');
const { verifyJWT, getLoggedInUserOrIgnore } = require("../../middlewares/AuthHandler");
const { UsefulLinks } = require("../../DB/MongoModels/UsefullinksModel");
router.route("/common").get(async (req, res) => {
    //let lat = req.query.lat;
    console.log("Useful links");
    try {
        res.setHeader('Content-Type', 'application/json');
        UsefulLinks.find({}).then(function (links) {
            res.send({ links: links });
        });
    } catch (error) {
        res.status(500).send(error);
    }
});

router.route("/:username").get(verifyJWT, async (req, res) => {
    //let lat = req.query.lat;
    let username = req.user.username || req.params.username;
    console.log("Useful links for user ", username);
    try {
        res.setHeader('Content-Type', 'application/json');
        UsefulLinks.find({ username: username }).then(function (links) {
            res.send({ links: links });
        });
    } catch (error) {
        res.status(500).send(error);
    }
});


//Create New Useful link
router.route("/addlink").post(verifyJWT, async (req, res) => {
    const { url, description, type } = req.body;
    try {
        const addedlink = await UsefulLinks.create({
            url,
            description,
            type,
            username: req.user.username || ""
        });
        const newCreatedLink = await UsefulLinks.findById(addedlink._id);
        if (!newCreatedLink) {
            throw ("Something went wrong while adding the link");
        }
        return res
            .status(201)
            .json({ link: newCreatedLink, message: "Link Added Successfully" });
    } catch (e) {
        console.log(e);
        res.send(e);
    }

});
//Update  Useful link
router.route("/updatelink/:id").put(verifyJWT, async (req, res) => {
    let linkid = req.params.id;
    let updatedLinkData = req.body;
    try {
        let docs = await UsefulLinks.findOneAndUpdate({ username: req.user.username, _id: linkid }, updatedLinkData);
        docs = await UsefulLinks.findOne({ _id: linkid });
        res.send({ message: "Updated Successfully", link: docs });
    } catch (e) {
        console.log(e);
        res.send(e);
    }

});
//Delete  Useful link
router.route("/deletelink/:id").delete(verifyJWT, async (req, res) => {
    let id = req.params.id;
    res.setHeader('Content-Type', 'application/json');
    console.log("id :",id);
    try{
        let result= await UsefulLinks.deleteOne({_id : id});
          res.json({message:"Deleted Successfully",...result});
        }catch( error) {
          console.log(error); 
          result = error.toString();
          res.send(result);
        }
  });
module.exports = router;

