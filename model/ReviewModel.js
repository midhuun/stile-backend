const mongoose = require('mongoose');
const { Schema } = mongoose;
const ReviewSchema = new Schema({
    title: String,
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    name:String,
    content: String,
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product'
        }
},{timestamps:true})
module.exports = mongoose.model('Review', ReviewSchema);
