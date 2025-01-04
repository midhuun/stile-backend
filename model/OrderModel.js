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
  totalPrice: {
    type: Number,
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
  totalAmount: {
    type: Number,
    required: true,
  },
},{timestamps:true});


const Order = mongoose.model('Order', orderSchema);

module.exports = { Order,ProductOrder};
