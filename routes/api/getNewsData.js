const express = require('express');
const router = express.Router();
const axios = require("axios");
const https = require('https');
const path = require('path');
const NEWS_BASE_URL = process.env.NEWS_DATA_URL;
const NEWS_API_KEY = process.env.NEWS_DATA_API_KEY;
const fetchNewsData = async (nextPageCode) => {
    let newsURL = NEWS_BASE_URL + "/api/1/latest?apikey=" + NEWS_API_KEY + "&language=en&country=in,np";
    if (nextPageCode.length > 0) {
        newsURL = newsURL + "&page=" + nextPageCode;
    }
    console.log("Fetching URL  : ", newsURL);
    try {
        const httpsAgent = new https.Agent({
            rejectUnauthorized: false,
        });
        let responseFromAPI = await axios.get(newsURL, { httpsAgent });
        if (responseFromAPI.data.results) {
            for (let iCount = 0; iCount < responseFromAPI.data.results.length; iCount++) {
                delete responseFromAPI.data.results[iCount].sentiment
                delete responseFromAPI.data.results[iCount].sentiment_stats
                delete responseFromAPI.data.results[iCount].ai_tag
                delete responseFromAPI.data.results[iCount].ai_region
                delete responseFromAPI.data.results[iCount].ai_org
                delete responseFromAPI.data.results[iCount].ai_summary
                delete responseFromAPI.data.results[iCount].ai_content
                delete responseFromAPI.data.results[iCount].duplicate
            }
        }
        return responseFromAPI.data;
    } catch (error) {

        console.log("Error Fetching News Data", error);
        return { "message": "Error while fetching News from API", error: error };

    }
}
router.route("/").get(async (req, res) => {
    let nextPageCode = req.query.page || "";
    let newsData = await fetchNewsData(nextPageCode);
    res.send(newsData);
});
module.exports = router;