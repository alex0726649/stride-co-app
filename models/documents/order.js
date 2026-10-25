const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customerId: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true},
    salesPersonId: {type: Number, index: true},
    totals: {
        subtotal: Number,
        shipping: Number,
        discount: Number,
        total: Number
    }
},
{
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);