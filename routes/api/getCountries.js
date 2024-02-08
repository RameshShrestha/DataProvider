const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");
const path = require('path');
const fs = require('fs');
let countries = require('../../DB/LocalDataProvider/Countries.json');
let cities = require('../../DB/LocalDataProvider/Cities.json');
let contriesWithCities = require('../../DB/LocalDataProvider/ContriesWithCities.json');

const e = require('express');


const { verifyJWT, getLoggedInUserOrIgnore } = require("../../middlewares/AuthHandler");
const { count } = require('console');



    router.route("/").get((req, res) => {
        console.log("fetching Countries");
        let result = "";
        try {
         
                res.setHeader('Content-Type', 'application/json');
                // let countriesData = countries.map((country)=>{
                //     country.flag = `https://flagcdn.com/h240/${country.CountryCode2.toLocaleLowerCase()}.png`
                //     return country;
                // });
                res.send(countries);
        
        } catch (error) {
            res.send(error);
        }
    });
    router.route("/:country").get((req, res) => {
        let country = req.params.country;
        console.log("fetching Country", country);
        try {
                res.setHeader('Content-Type', 'application/json');
                let countryDetail = countries.filter(item=>item.Country === country);
                // if(countryDetail.length === 1){
                //     countryDetail[0].cities = contriesWithCities[countryDetail[0].Country] || [];
                //     countryDetail[0].flag = `https://flagcdn.com/h240/${countryDetail[0].CountryCode2.toLocaleLowerCase()}.png`
                // }
                res.send(countryDetail);
        } catch (error) {
            res.send(error);
        }
    });
    router.route("/:country/cities").get((req, res) => {
        let country = req.params.country;
        console.log("fetching Cities of Country", country);
        try {
                res.setHeader('Content-Type', 'application/json');
                let countryCities = cities.filter(item=>item.Country === country);
                // if(countryDetail.length === 1){
                //     countryDetail[0].cities = contriesWithCities[countryDetail[0].Country] || [];
                //     countryDetail[0].flag = `https://flagcdn.com/h240/${countryDetail[0].CountryCode2.toLocaleLowerCase()}.png`
                // }
                res.send(countryCities);
        } catch (error) {
            res.send(error);
        }
    });
    module.exports =  router;

