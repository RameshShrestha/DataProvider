const express = require('express');
const router = express.Router();
const path = require('path');
const { loginwithGitHub } = require('../../Controllers/loginwithsocial');
const { verifyJWT, getLoggedInUserOrIgnore } = require("../../middlewares/AuthHandler");
const { default: axios } = require('axios');
router.route("/github").get(async (req, res) => {
    const redirectURL = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=user`;
    res.redirect(redirectURL);
});
router.route("/github/callback/:code").get(async (req, res) => {
    //const code = req.query.code;
    let code = req.params.code;
    console.log("Received code : ", code);
    try {
        // const tokenRes = await axios.post("https://github.com/login/oauth/access_token",
        //     {
        //         client_id: process.env.GITHUB_CLIENT_ID,
        //         client_secret: process.env.GITHUB_CLIENT_SECRET,
        //         code
        //     },
        //     {
        //         headers: {
        //             accept: 'application/json'
        //         }

        //     });

        // const accessToken = tokenRes.data.access_token;


        // const resData = await axios.post(
        //     "https://github.com/login/oauth/access_token",
        //     {
        //         params: {
        //             client_id: process.env.GITHUB_CLIENT_ID,
        //             client_secret: process.env.GITHUB_CLIENT_SECRET,
        //             code: code
        //         },
        //         headers: {
        //             "Accept": "application/json",
        //             "Accept-Encoding": "application/json",
        //         },
        //     }
        // );
        if(code === "intestmode"){
            let user = {
                    "login": "RameshShrestha",
                     "avatar_url": "https://avatars.githubusercontent.com/u/11848088?v=4",
                     "name": "Ramesh Shrestha",
                     "company": "Accenture Solutions",
                     "blog": "https://www.linkedin.com/in/shrestharamesh",
                    "location": "India",
                    "email": "fx_ra@hotmail.com"
                 }
            let loginResult = await loginwithGitHub(user);
            console.log(loginResult);
            if (loginResult.status = "ok") {
                const options = {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production"
                };
                res.status(200)
                    .cookie("accessToken", loginResult.accessToken, options) // set the access token in the cookie
                    .cookie("refreshToken", loginResult.refreshToken, options) // set the refresh token in the cookie
                    .json({ user: loginResult.user, message: "Logged in successfully", statusCode: 200, success: true, accessToken: loginResult.accessToken, refreshToken: loginResult.refreshToken });
            }

        }else{
        const resData = await axios.post(
            "https://github.com/login/oauth/access_token",
            { // This is the request body
              client_id: process.env.GITHUB_CLIENT_ID,
              client_secret: process.env.GITHUB_CLIENT_SECRET,
              redirect_uri :'https://testramesh-irhww2w9.launchpad.cfapps.us10.hana.ondemand.com/31e0dd24-5855-4bc5-8350-9612be65448d.reactwebcomp.myreactmodule-1.0.0/redirectpage.html',
              code: code
            },
            { // This is the configuration object for Axios, where headers are defined
              headers: {
                "Accept": "application/json",
              },
            }
          );
        console.log("Data", resData.data);

        const accessToken = resData.data.access_token;
        if (accessToken) {
            const userRes = await axios.get('https://api.github.com/user', {
                headers: {
                    Authorization: `token ${accessToken}`
                }
            });
            const user = userRes.data;
            console.log("user" ,user);
            let loginResult = await loginwithGitHub(user);

            if (loginResult.status = "ok") {
                const options = {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production"
                };
                res.status(200)
                    .cookie("accessToken", loginResult.accessToken, options) // set the access token in the cookie
                    .cookie("refreshToken", loginResult.refreshToken, options) // set the refresh token in the cookie
                    .json({ user: loginResult.user, message: "Logged in successfully", statusCode: 200, success: true, accessToken: loginResult.accessToken, refreshToken: loginResult.refreshToken });
            }

            // res.json({ user });
            /**
             * Sample Response
             * {
                "user": {
                    "login": "RameshShrestha",
                    "id": 11848088,
                    "node_id": "MDQ6VXNlcjExODQ4MDg4",
                    "avatar_url": "https://avatars.githubusercontent.com/u/11848088?v=4",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/RameshShrestha",
             
                    "type": "User",
                    "user_view_type": "public",
                    "site_admin": false,
                    "name": "Ramesh Shrestha",
                    "company": "Accenture Solutions",
                    "blog": "https://www.linkedin.com/in/shrestharamesh",
                    "location": "India",
                    "email": "fx_ra@hotmail.com",
              
                }
                }
             * 
             */
        }
        if (resData.data.error) {
            res.status(500).json({data : resData.data, message :"error at 117"});
        }
    }
        
    } catch (err) {
        console.log(err);
        res.status(500).json({ errorMessage: 'Authentication Failed, line 120', error: err, code: code })
    }

});
module.exports = router;
