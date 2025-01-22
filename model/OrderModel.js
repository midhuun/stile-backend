const mongoose = require('mongoose');

const orderProductSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,  
    required: true,
    ref: 'Product',
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  selectedSize:{
    type:String,
    required:true
  },
},{timestamps:true});
const ProductOrder = mongoose.model('ProductOrder',orderProductSchema);
const addressSchema = new mongoose.Schema({
  name: { type: String },
  location: { type: String },
  apartment: { type: String},
  city: { type: String,  },
  alternateMobile: { type: String },
}); 
const orderSchema = new mongoose.Schema({
  products: [{type:mongoose.Schema.ObjectId,required:true,ref:"ProductOrder"}],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref:"User"
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  paymentMethod:{
    type:String,
    enum:["cod","RazorPay"],
    required:true
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  details:{
    type:String
  },
  info:{
    type:String
  },
  pincode:{
    type:Number,
    required:true
  }
},{timestamps:true});


const OrderModel = mongoose.model('Order', orderSchema);

module.exports = { OrderModel,ProductOrder};
