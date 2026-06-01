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

// TTL: anonymous session carts auto-expire 30 days after last update (note §5.4).
cartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Cart', cartSchema);
