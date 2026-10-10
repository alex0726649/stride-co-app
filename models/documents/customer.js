const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    userId: {type: Number, require: true},
    phone: String,
    email: String,

    //Lista de direcciones del cliente Embebido (vive dentro de otra entidad)
    addresses : [
        {
            type:{ type: String, enum: ['SHIPPING', 'BILLING'], require: true},
            stret: String,
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

module.export = mongoose.model('Customer', customerSchema);