const mongoose = require('mongoose');
const env = require("dotenv");
env.config();
const mongouri = process.env.MONGODB_URI || process.env.MONGO_URI || '';
const connectTODB = async () => {
    try {
        if (!mongouri) {
            throw new Error('Missing MONGODB_URI environment variable');
        }
        await mongoose.connect(mongouri, {
            serverSelectionTimeoutMS: 8000,
        });
        console.log("Connected to Database")
    }
    catch(err){
        console.log('Error Connecting to Database',err)
    }
}
module.exports = {connectTODB};