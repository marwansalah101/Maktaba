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
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
  googleId: {
    type: String,
    trim: true,
    default: '',
  },
  picture: {
    type: String,
    trim: true,
    default: '',
  },
  phone: {
    type: String,
    trim: true,
  },
  // Saved shipping address (Settings → Address)
  address: {
    fullName: { type: String, trim: true, default: '' },
    street:   { type: String, trim: true, default: '' },
    city:     { type: String, trim: true, default: '' },
    phone:    { type: String, trim: true, default: '' },
  },
  // Saved payment method — only a masked summary is ever stored
  payment: {
    method:   { type: String, trim: true, default: '' },
    cardName: { type: String, trim: true, default: '' },
    last4:    { type: String, trim: true, default: '' },
    expiry:   { type: String, trim: true, default: '' },
  },
  // Liked books (stored by title, matching the catalogue identifiers)
  favorites: {
    type: [String],
    default: [],
  },
  // Persisted shopping cart
    cart: {
      type: [{
      _id:    false,
      title:  String,
      author: String,
      image:  String,
      price:  mongoose.Schema.Types.Mixed,
      originalPrice: { type: mongoose.Schema.Types.Mixed, default: 0 },
      salePrice:      { type: mongoose.Schema.Types.Mixed, default: 0 },
      salePercent:    { type: Number, default: 0 },
      isOnSale:       { type: Boolean, default: false },
      qty:    { type: Number, default: 1, min: 1 },
    }],
    default: [],
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
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
