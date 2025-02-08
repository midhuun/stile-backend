const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
    email: String,
    otp: String,
    createdAt: { type: Date, default: Date.now, expires: 300 }, // Auto-delete after 5 min
});

const OtpModel = mongoose.model("Otp", otpSchema);
module.exports = {OtpModel};