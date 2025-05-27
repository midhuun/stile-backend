const mongoose = require('mongoose');
const env = require("dotenv");
env.config();
const mongouri = process.env.MONGODB_URI;
console.log(mongouri)
const connectTODB = async () => {
    try {
        await mongoose.connect(mongouri);
        console.log("Connected to Database")
    }
    catch(err){
        console.log('Error Connecting to Database',err)
    }
}
module.exports = {connectTODB};