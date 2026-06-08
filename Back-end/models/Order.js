const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
    bookId:   { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
    title:    { type: String, required: true },
    author:   { type: String },
    price:    { type: Number, required: true },
    image:    { type: String },
    quantity: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
    orderNumber: { type: String, unique: true, sparse: true },
    userEmail:   { type: String, required: true, lowercase: true, trim: true },
    items:       [orderItemSchema],
    totalAmount: { type: Number, required: true },
    paymentMethod: {
        type: String,
        enum: ["credit_card", "debit_card", "cash_on_delivery"],
        default: "credit_card"
    },
    orderStatus: {
        type: String,
        enum: ["processing", "shipped", "delivered", "cancelled"],
        default: "processing"
    },
    shippingAddress: {
        fullName: String,
        address:  String,
        city:     String,
        phone:    String
    },
    createdAt: { type: Date, default: Date.now }
});

// Auto-generate orderNumber before save if not already set
orderSchema.pre("save", function (next) {
    if (!this.orderNumber) {
        this.orderNumber = "MKTBA-" + String(this._id).slice(-6).toUpperCase();
    }
    next();
});

module.exports = mongoose.model("Order", orderSchema);
