const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    serviceName: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date, // C'est important que ce soit un type Date pour les requêtes
        required: true
    },
    time: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    hasColor: {
        type: Boolean,
        default: false
    },
    paymentMethod: {
        type: String,
        enum: ['mtn', 'moov', 'autres', 'non spécifié'],
        default: 'non spécifié'
    },
    paymentProof: {
        type: String,
        default: 'N/A'
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Reservation', reservationSchema);