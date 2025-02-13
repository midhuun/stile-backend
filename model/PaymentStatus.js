const mongoose = require('mongoose');
const { Schema } = mongoose;
const PaymentStatusSchema = new Schema({
    paymentStatus: {
        type: String,  
    },
    orderid:{
        type:String
    }
},{timestamps:true});
module.exports = mongoose.model('PaymentStatus', PaymentStatusSchema);