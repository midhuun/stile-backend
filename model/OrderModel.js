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
const orderSchema = new mongoose.Schema({
  products: [orderProductSchema],
  orderId:String,
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
    enum:["cod","CashFree"],
    required:true
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  address:{
    type:Object
  },
  pincode:{
    type:Number,
    required:true
  }
},{timestamps:true});


const OrderModel = mongoose.model('Order', orderSchema);

module.exports = { OrderModel};
