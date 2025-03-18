const mongoose = require('mongoose');
const { Schema } = mongoose;
const ShipmentSchema = new Schema({
  my_order_id: String,
  order_id: {
    type: Number,
    required: true,
  },
  shipment_id: {
    type: Number,
    default: null, // Allows null values
  },
  status: {
    type: String,
    default: null,
  },
  status_code: {
    type: Number,
    default: null,
  },
  onboarding_completed_now: {
    type: Number,
    default: null,
  },
  awb_code: {
    type: Schema.Types.Mixed, // Allows Number or String
    default: null,
  },
  courier_company_id: {
    type: Schema.Types.Mixed, // Allows Number or String
    default: null,
  },
  courier_name: {
    type: Schema.Types.Mixed, // Allows Number or String
    default: null,
  },
});
module.exports = mongoose.model('Shipment', ShipmentSchema);
