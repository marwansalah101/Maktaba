const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  bookId:  { type: String, required: true },
  title:   { type: String, required: true },
  author:  { type: String },
  image:   { type: String },
  price:   { type: Number, required: true },
  qty:     { type: Number, default: 1, min: 1 }
});

const cartSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  items:     [cartItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);