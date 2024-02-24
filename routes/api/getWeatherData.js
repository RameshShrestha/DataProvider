const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");
const axios = require("axios");
const https = require('https');
const path = require('path');
const fs = require('fs');
const { verifyJWT, getLoggedInUserOrIgnore } = require("../../middlewares/AuthHandler");
let executedClearBackupTime = new Date();
const jsonReader = function (filePath, cb) {
   // console.log("Reading file", filePath);
    fs.readFileSync(filePath, (err, fileData) => {
        if (err) {
            console.log("error fetching file", err);
            return cb && cb(err);
        }
        try {
            const object = JSON.parse(fileData);
           // console.log("File Content", object);
            return cb && cb(null, object);
        } catch (err) {
            console.log("Error", err);
            return cb && cb(err);
        }
    });
}
const fetchWeatherData = async (lat, lng) => {
    const baseURL = process.env.REACT_APP_SERVER_URI;
    const weatherAPI_KEY = process.env.WEATHER_MAP_KEY;
    //fbd047818a40bf66cd9604220d935815
    const weatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${weatherAPI_KEY}&units=metric`;

    try {

        const httpsAgent = new https.Agent({
            rejectUnauthorized: false,
        });
        let responseFromAPI = await axios.get(weatherURL, { httpsAgent });

        // const returnedWeatherData = await responseFromAPI.json();
        //console.log(responseFromAPI);
        return responseFromAPI.data;
    } catch (error) {
        return { "message": "Error while fetching Data", error: error };
        console.log(error);
    }
}
const fetchWeatherForcastData = async (lat, lng) => {
    const baseURL = process.env.REACT_APP_SERVER_URI;
    const weatherAPI_KEY = process.env.WEATHER_MAP_KEY;
    //fbd047818a40bf66cd9604220d935815
    const weatherForcastURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${weatherAPI_KEY}&units=metric`;
    try {

        const httpsAgent = new https.Agent({
            rejectUnauthorized: false,
        });
        let responseFromAPI = await axios.get(weatherForcastURL, { httpsAgent });

        // const returnedWeatherData = await responseFromAPI.json();
        //console.log(responseFromAPI);
        return responseFromAPI.data;
    } catch (error) {
        return { "message": "Error while fetching Data", error: error };
        console.log(error);
    }
}
const clearOldWeatherData = async () => {
    try {
        let fileData = fs.readFileSync("./DB/LocalDataProvider/WeatherBackup.json");
        const data = JSON.parse(fileData);
        //  console.log("data", data);
        let newWeatherData = data?.weatherData?.filter((item) => {

            let differenceInHour = (new Date() - new Date(item.backupTime)) / (3600 * 1000);
            if (differenceInHour < 24) {
                return item;
            }
        });
        const finalData = { "weatherData": newWeatherData };
        const jsonString = JSON.stringify(finalData);
        fs.writeFileSync('./DB/LocalDataProvider/WeatherBackup.json', jsonString);
       // console.log("Weather Data prior 24 hours are removed");
        executedClearBackupTime = new Date();
    } catch (error) {
        console.log(error);
    }
}
const checkLocalWeatherData = async (lat, lng) => {

    await clearOldWeatherData(); // need to optimize to execute only once per day

    let latRange = { min: lat - 10, max: lat + 10 };
    let lngRange = { min: lng - 10, max: lng + 10 };
  //  console.log("checking local Weather Data");
    try {
        let fileData = fs.readFileSync("./DB/LocalDataProvider/WeatherBackup.json");
        const data = JSON.parse(fileData);
        //  console.log("data", data);
        let localWeatherData = data?.weatherData?.filter((item) => {

            let differenceInHour = (new Date() - new Date(item.backupTime)) / (3600 * 1000);


            if (item.lat > latRange.min && item.lat < latRange.max
                && item.lng > lngRange.min && item.lat < lngRange.max && differenceInHour < 10) {
                return item;
            }
        });
        //  console.log("localWeatherData", localWeatherData)
        return { success: localWeatherData?.length > 0, data: localWeatherData };


    } catch (error) {
        console.log(error);
        return { success: false, error: error };

    }
}
const saveFetchedWeatherData = async (data, forcastData, lat, lng) => {
    let dataToSave = { lat: lat, lng: lng, data: data, forcast: forcastData, backupTime: new Date() }
    try {
        let fileData = fs.readFileSync("./DB/LocalDataProvider/WeatherBackup.json");
        const data = JSON.parse(fileData);

        if (data.weatherData) {
            data.weatherData.push(dataToSave);
        } else {
            data.weatherData = [];
            data.weatherData.push(dataToSave);
        }
       // console.log(data);
        const finalData = { "weatherData": data.weatherData };
        const jsonString = JSON.stringify(finalData);
        // console.log("Writing to local data ", jsonString);
        fs.writeFileSync('./DB/LocalDataProvider/WeatherBackup.json', jsonString);
        return { message: "ok", success: true };
    } catch (e) {
        console.log("Error", e);
        return { message: "error", error: e };
    }



}
router.route("/").get(async (req, res) => {
    let lat = req.query.lat;
    let lng = req.query.lng;
    console.log("fetching data for", lat, lng)
    if (!lat || !lng) {
        //no values send
        res.status(401).send({ message: "Mandatory latitue and longitute values" });
        return;
    }
    console.log("fetching Weather Data");
    let result = "";
    try {
        res.setHeader('Content-Type', 'application/json');
        //check if weather data is already available locally
        const result = await checkLocalWeatherData(lat, lng);
        // console.log("Returned from local data", result);
        if (result.data.length > 0) {
            console.log("Found in local Database");
            res.send({ "weathertoday": result.data[0].data, "forcast": result.data[0].forcast });
        } else {
            const weatherData = await fetchWeatherData(lat, lng);
            const weatherForcastData = await fetchWeatherForcastData(lat, lng);
            // console.log("WeatherData", weatherData);
            //save the fetched Weather Data
            await saveFetchedWeatherData(weatherData, weatherForcastData, lat, lng);
            res.send(weatherData);
        }
    } catch (error) {
        res.send(error);
    }
});
// router.route("/forcast").get(verifyJWT, async (req, res) => {
//     let lat = req.query.lat;
//     let lng = req.query.lng;
//     if (!lat || !lng) {
//         //no values send
//         res.status(401).send({ message: "Mandatory latitue and longitute values" });
//     }
//     console.log("fetching Weather Forcard", lat,lng);
//     try {
//         res.setHeader('Content-Type', 'application/json');

//         res.send({ "data": "forcast data will be provided here", lat : lat, lng : lng });
//     } catch (error) {
//         res.send(error);
//     }
// });

module.exports = router;

