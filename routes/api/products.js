const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { verifyJWT, getLoggedInUserOrIgnore } = require("../../middlewares/AuthHandler");
let data = require('../../users.json');
const dotenv = require('dotenv');
var productfile = require('./products.json');
dotenv.config({
    path: "./.env",
});
function jsonReader(filePath, cb) {
    fs.readFile(filePath, (err, fileData) => {
        if (err) {
            console.log("error fetching file", err);
            return cb && cb(err);
        }
        try {
            const object = JSON.parse(fileData);
            return cb && cb(null, object);
        } catch (err) {
            return cb && cb(err);
        }
    });
}

router.route("/").get(function (req, res) {
    // res.sendFile(path.join(__dirname+'/products.json'));
    if (Object.keys(req.query).length === 0) {
        res.setHeader('Content-Type', 'application/json');
        jsonReader("./routes/api/products.json", (err, data) => {
            if (err) {
                console.log(err);
                res.send(err);
                return;
            }
            // console.log(data.products[2]); // => "Infinity Loop Drive"
            //,"total":100,"skip":0,"limit":30
            data.total = data.length;
            data.skip = 0;
            data.limit = data.length;
            res.send(data);
        });

        //  res.send(productfile);
    } else {
        res.setHeader('Content-Type', 'application/json');
        // var data = JSON.parse(productfile);
        jsonReader("./routes/api/products.json", (err, data) => {
            if (err) {
                console.log(err);
                res.send(err);
                return;
            }
            let filterId =   Number(req.query.id);
            let filterTitle =   req.query.title;
            let filterDescription =   req.query.description;
            let filterRating  =  Number(req.query.rating);
            let filteredProducts = data.products;
           
            if(filterRating){
                filteredProducts = filteredProducts.filter((item)=>(Math.floor(item.rating) === filterRating));
            }
            if(filterId){
                filteredProducts = filteredProducts.filter((item)=>(item.id === filterId));
            }
            if(filterTitle){
                filteredProducts = filteredProducts.filter((item)=>(item.title.toLowerCase().includes(filterTitle.toLowerCase())));
            }
            if(filterDescription){
                filteredProducts = filteredProducts.filter((item)=>(item.description.toLowerCase().includes(filterDescription.toLowerCase())));
            }
            data.total = data.length;
            data.skip = 0;
            data.limit = data.length;
            let skip = Number(req.query.skip) || 0;
            let limit = req.query.limit;
            if (req.query.limit > filteredProducts.length) {
                limit = filteredProducts.length;
            }
            limit = parseInt(limit);
            const finalData = {
                "products": filteredProducts.slice(skip, limit), "total": filteredProducts.length,
                skip: skip, limit: limit
            };
            res.send(finalData);
        });
    }
    //__dirname : It will resolve to your project folder.
});
router.route("/").post(verifyJWT,(req, res) => {
    res.setHeader('Content-Type', 'application/json');
    let requestedUser =  req.user.username;
    let newData = req.body;

    jsonReader("./routes/api/products.json", (err, data) => {
        if (err) {
            res.send(err);
            return;
        }
        const dataLength = data.products[data.products.length - 1].id || 0;
        newData.id = parseInt(dataLength) + 1;

        newData.createdBy = requestedUser;
        newData.updatedBy = requestedUser;
        newData.createdOn = new Date();
        newData.updatedOn = new Date();
        data.products.push(newData);

        const finalData = { "products": data.products };
        const jsonString = JSON.stringify(finalData);
        try {


            fs.writeFileSync('./routes/api/products.json', jsonString);
        } catch (e) {
            res.send({ message: "error", data: e });
        }
        res.send({ message: "Added Successfully", data: newData });
    });
});
router.route("/:ids").put(verifyJWT,(req, res) => {
    let ids = req.params.ids;
    let idsArray = ids.split(",");
    let requestedUser =  req.user.username;
    console.log("update request by :", requestedUser);
    let updatedProducts = req.body;
    console.log(ids, updatedProducts);
    res.setHeader('Content-Type', 'application/json');
    jsonReader("./routes/api/products.json", (err, data) => {
        if (err) {
            res.send(err);
            return;
        }
        const FinalProducts = data.products.map((product) => {
            if (idsArray.indexOf(product.id.toString()) >-1) {
                console.log("record found", product.id);
                const foundProducts= updatedProducts.filter((updatedProduct) =>(updatedProduct.id === product.id && product.createdBy === requestedUser));
                if(foundProducts.length>0){
                    foundProducts[0].updatedBy =requestedUser;
                    foundProducts[0].updatedOn = new Date();
                     return foundProducts[0];
                }else{
                    //should not come here any way , incase it comes it will return original data;
                    return product;
                }
                //console.log("Record to update", recordToUpdate);
            } else {
                return product;
            }
        })
        const finalData = { "products": FinalProducts };
        const jsonString = JSON.stringify(finalData);
        fs.writeFileSync('./routes/api/products.json', jsonString)
        res.send({ message: "Updated Successfully", data: updatedProducts });
    });
});
router.route("/:id").delete(verifyJWT,(req, res) => {
    let id = req.params.id;
    let requestedUser =  req.user.username;
    res.setHeader('Content-Type', 'application/json');

    jsonReader("./routes/api/products.json", (err, data) => {
        if (err) {
            res.send(err);
            return;
        }
        // const dataLength = data.products.length || 0;
        const productIndex = data.products.findIndex(p => p.id == id);

        if (productIndex < 0) {
            res.send("No such record found");
        }else if(data.products[productIndex].createdBy !== requestedUser){
            console.log("Users :" ,requestedUser,data.products[productIndex].createdBy )
            res.status(401).send({ message: "Unauthorized to delete others record"});
        }
         else {
            data.products.splice(productIndex, 1);
            const recordTobeDeleted = data.products[productIndex];
            const finalData = { "products": data.products };
            const jsonString = JSON.stringify(finalData);
            fs.writeFileSync('./routes/api/products.json', jsonString)
            res.send({ message: "Removed Successfully", data: recordTobeDeleted });
        }
    });
});
module.exports = router;