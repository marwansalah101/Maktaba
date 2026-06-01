const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  phone: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
  }],
  // Saved shipping address
  address: {
    fullName: { type: String, trim: true, maxlength: 120, default: '' },
    street:   { type: String, trim: true, maxlength: 200, default: '' },
    city:     { type: String, trim: true, maxlength: 100, default: '' },
    phone:    { type: String, trim: true, maxlength: 40,  default: '' },
  },
  // Saved payment method — NEVER store full card number or CVV (PCI).
  // Only a masked summary is persisted.
  payment: {
    method:   { type: String, trim: true, maxlength: 40, default: '' },
    cardName: { type: String, trim: true, maxlength: 120, default: '' },
    last4:    { type: String, trim: true, maxlength: 4,  default: '' },
    expiry:   { type: String, trim: true, maxlength: 7,  default: '' },
  },
  // Server-persisted shopping cart for logged-in users
  cart: [{
    bookId: { type: String, default: '' },
    title:  { type: String, required: true },
    author: { type: String, default: '' },
    image:  { type: String, default: '' },
    price:  { type: Number, default: 0 },
    qty:    { type: Number, default: 1, min: 1 },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
