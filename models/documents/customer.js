const mongoose = require('mongoose');

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const customerSchema = new mongoose.Schema({
    // Referencia a users.id (INTEGER en PostgreSQL): entero positivo.
    userId: {
        type: Number,
        required: true,
        min: 1,
        max: 2147483647,
        validate: { validator: Number.isInteger, message: 'userId debe ser un número entero' },
    },
    phone: { type: String, trim: true },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [EMAIL_FORMAT, 'El email no tiene un formato válido'],
    },

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