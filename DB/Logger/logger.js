const { userLogs } = require("../MongoModels/userLoggerModel");
const addCallerLog = async (hostname, ip, path) => {
    console.log("Adding to Log", hostname, ip, path);
    try {
         await userLogs.create({ hostname, ip, path });
    } catch (e) {
        console.log(e);
    }
}
module.exports = { addCallerLog }