const mongoose = require('mongoose');
const { Schema } = mongoose;
const BannerSchema = new Schema({
    title:String,
    image:String,
})
const BannerModel = mongoose.model('Banner',BannerSchema);
module.exports = {BannerModel};