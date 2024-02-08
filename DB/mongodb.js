const mongoose = require('mongoose');
const  {DB_NAME}  =require("../Constants");
//console.log(DB_NAME,process.env.MONGODB_URI);
/** @type {typeof mongoose | undefined} */
 let dbInstance = undefined;
 let dbConnected = false;

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    dbInstance = connectionInstance;
    dbConnected = true;
    console.log(
      `\n☘️  MongoDB Connected! Db host: ${connectionInstance.connection.host}\n`
    );
    return dbConnected;
  } catch (error) {

    console.log("MongoDB connection error, Mongo DB is not available");
    return dbConnected;
   // process.exit(1);
  }
};

module.exports= {connectDB,dbInstance,dbConnected};
