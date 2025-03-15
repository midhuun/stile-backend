const mongoose = require('mongoose');

const orderProductSchema = new mongoose.Schema(
  {
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
    selectedSize: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
const orderSchema = new mongoose.Schema(
  {
    products: [orderProductSchema],
    orderId: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    trackingId: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    address: {
      type: Object,
    },
    email: {
      type: String,
    },
    alternateMobile: {
      type: String,
    },
    pincode: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

const OrderModel = mongoose.model('Order', orderSchema);

module.exports = { OrderModel };
