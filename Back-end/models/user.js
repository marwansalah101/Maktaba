const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ─── Sub-schemas ────────────────────────────────────────────────────────────

const addressSchema = new mongoose.Schema(
  {
    street:  { type: String },
    city:    { type: String },
    country: { type: String },
    zipCode: { type: String },
  },
  { _id: false }
);

const CURRENT_YEAR = new Date().getFullYear();

const paymentSchema = new mongoose.Schema(
  {
    cardHolder:  { type: String },
    lastFour:    { type: String, minlength: 4, maxlength: 4 }, // never store full card number
    expiryMonth: { type: Number, min: 1, max: 12 },
    expiryYear:  { type: Number, min: CURRENT_YEAR },
    cardType:    { type: String, enum: ['visa', 'mastercard', 'amex'] },
  },
  { _id: false }
);

const cartItemSchema = new mongoose.Schema(
  {
    book:     { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    quantity: { type: Number, default: 1, min: 1 },
  },
  { _id: false }
);

// ─── User schema ─────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema(
  {
    // Identity
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    phone:    { type: String, trim: true },

    // Role
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    // Profile
    avatar: { type: String, default: null }, // image URL

    // Embedded documents
    address: addressSchema,
    payment: paymentSchema,

    // References
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
    cart:      [cartItemSchema],
    orders:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  },
  { timestamps: true }
);

// ─── Hooks ───────────────────────────────────────────────────────────────────

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  if (update.password) {
    update.password = await bcrypt.hash(update.password, 12);
  }
  next();
});

// ─── Methods ─────────────────────────────────────────────────────────────────

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// ─── Model ───────────────────────────────────────────────────────────────────

module.exports = mongoose.model('User', userSchema);
