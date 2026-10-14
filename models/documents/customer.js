const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    userId: {type: Number, required: true},
    phone: String,
    email: String,

    //Lista de direcciones del cliente Embebido (vive dentro de otra entidad)
    addresses : [
        {
            type:{ type: String, enum: ['SHIPPING', 'BILLING'], required: true},
            street: String,
            number: String,
            city: String,
            state: String,
            zipCode: String,
            country: String

        }
    ]

}, {
    timestamps: true
});

module.exports = mongoose.model('Customer', customerSchema);