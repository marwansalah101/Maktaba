const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    bookId: { type: String, required: true },
    title:  { type: String, required: true },
    author: { type: String, default: '' },
    image:  { type: String, default: '' },
    price:  { type: Number, required: true },
    qty:    { type: Number, required: true, min: 1, default: 1 },
}, { _id: false });

const cartSchema = new mongoose.Schema(
    {
        sessionId: { type: String, required: true, unique: true, index: true },
        items:     { type: [cartItemSchema], default: [] },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);    
