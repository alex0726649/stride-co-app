const mongoose = require('mongoose');
const { PAYMENT_METHODS, ORDER_STATUSES, isPositiveInteger } = require('../../utils/order-fields');

const orderItemSchema = new mongoose.Schema({
  productId: { type: Number, required: true, validate: isPositiveInteger },
  quantity: { type: Number, required: true, validate: isPositiveInteger },
  unitPrice: { type: Number, required: true, min: 0, validate: Number.isFinite },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  salesPersonId: { type: Number, index: true, validate: isPositiveInteger },
  paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
  items: {
    type: [orderItemSchema],
    default: undefined,
    required: true,
    validate: items => items.length > 0,
  },
  status: { type: String, enum: ORDER_STATUSES, default: ORDER_STATUSES[0], required: true },
  totals: {
    subtotal: Number,
    shipping: Number,
    discount: Number,
    total: Number,
  },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
