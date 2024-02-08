const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
let data = require('../../users.json');

router.route("/").get((req, res) => {
  if (Object.keys(req.query).length === 0) {
    res.setHeader('Content-Type', 'application/json');
    res.json(data);
    //  res.send(productfile);
  } else {
    res.setHeader('Content-Type', 'application/json');
    console.log(req.query);
    let skip = Number(req.query.skip || 0);
    let limit = Number(req.query.limit);
    let filteredData = data.users;
    if(req.query.firstName){
      filteredData = filteredData.filter((user)=>(user.firstName.indexOf(req.query.firstName)>-1))
    }
    if(req.query.lastName){
      filteredData = filteredData.filter((user)=>(user.lastName.indexOf(req.query.lastName)>-1))
    }
    if(req.query.userId){
      filteredData = filteredData.filter((user)=>(user.userId.indexOf(req.query.userId)>-1))
    }
    if(req.query.age){
      filteredData = filteredData.filter((user)=>(user.age === Number(req.query.age)))
    }
    let total = filteredData.length;
    data.skip = skip;
    data.limit = limit;
    limit = parseInt(limit);
    const finalData = {
      "users": filteredData.slice(skip, (limit + skip)), "total": total,
      skip: Number(skip), limit: limit
    };
    //  console.log(finalData);
    res.json(finalData);
  }
});


router.route("/:id").get((req, res) => {
  let id = Number(req.params.id);
  if (id) {
    res.setHeader('Content-Type', 'application/json');
    const usersCopy = [...data.users];
    const userData = data.users.find(user => user.id == id);
    res.json(userData);
    //  res.send(productfile);
  } else {
    res.send("Invalid Id Provided");
  }
});
//Create New User
router.route("/").post((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  let newData = req.body;
  const lastId = data.users[data.users.length - 1].id || 0;
  console.log("dataLength", lastId);
  newData.id = parseInt(lastId) + 1;
  //    data.users.push(newData);
  const newUserList = [...data.users, newData];
  const finalData = { "users": newUserList, total: newUserList.length };
  const jsonString = JSON.stringify(finalData);
  fs.writeFileSync('./users.json', jsonString)
  res.send({ message: "Added Successfully", data: finalData });

});
//Update Record
router.route("/:id").put((req, res) => {
  let id = Number(req.params.id);
  let updatedUserData = req.body;
  if (id) {
    res.setHeader('Content-Type', 'application/json');
    const updatedUsers = data.users.map(user => {
      if (user.id == id) {
        return updatedUserData;
      } else {
        return user;
      }
    });
    const finalData = { "users": updatedUsers, "total": updatedUsers.length };
    const jsonString = JSON.stringify(finalData);
    fs.writeFileSync('./users.json', jsonString)
    res.send({ message: "Updated Successfully", data: updatedUserData });
  }
});


router.route("/:id").delete((req, res) => {
  let id = req.params.id;
  res.setHeader('Content-Type', 'application/json');
  const usersCopy = [...data.users];
  const userIndex = usersCopy.findIndex(user => user.id == id);
  if (userIndex < 0) {
    res.send("No such User found");
  } else {
    usersCopy.splice(userIndex, 1);

    const recordTobeDeleted = usersCopy[userIndex];
    const finalData = { "users": usersCopy, total: usersCopy.length };
    const jsonString = JSON.stringify(finalData);
    fs.writeFileSync('./users.json', jsonString)
    res.send({ message: "Removed Successfully", data: recordTobeDeleted });
  }

});
module.exports = router;
