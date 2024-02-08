const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
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
            data.total = data.length;
            data.skip = 0;
            data.limit = data.length;
            let skip = req.query.skip || 0;
            let limit = req.query.limit;
            if (req.query.limit > data.length) {
                limit = data.length;
            }
            limit = parseInt(limit);
            const finalData = {
                "products": data.products.slice(skip, limit), "total": data.products.length,
                skip: skip, limit: limit
            };
            res.send(finalData);
        });
    }
    //__dirname : It will resolve to your project folder.
});
router.route("/").post((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    let newData = req.body;

    jsonReader("./routes/api/products.json", (err, data) => {
        if (err) {
            res.send(err);
            return;
        }
        const dataLength = data.products[data.products.length - 1].id || 0;
        newData.id = parseInt(dataLength) + 1;
        data.products.push(newData);

        const finalData = { "products": data.products };
        const jsonString = JSON.stringify(finalData);
        try {


            fs.writeFileSync('./products.json', jsonString);
        } catch (e) {
            res.send({ message: "error", data: e });
        }
        res.send({ message: "Added Successfully", data: newData });
    });
});
router.route("/:ids").put((req, res) => {
    let ids = req.params.ids;
    let idsArray = ids.split(",");

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
                const foundProducts= updatedProducts.filter((updatedProduct) =>(updatedProduct.id === product.id));
                if(foundProducts.length>0){
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
router.route("/:id").delete((req, res) => {
    let id = req.params.id;

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
        } else {
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