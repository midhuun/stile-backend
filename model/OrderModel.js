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
  address:{
    type:Object,
    required:true
  },
  pincode:{
    type:Number,
    required:true
  }
},{timestamps:true});


const Order = mongoose.model('Order', orderSchema);

module.exports = { Order,ProductOrder};
