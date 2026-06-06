const express = require("express");
const router  = express.Router();
const Order   = require("../models/Order");
const Cart    = require("../models/Cart");

function getUserEmail(req) {
    return (req.headers["x-user-email"] || "").trim().toLowerCase();
}

function requireEmail(req, res, next) {
    const email = getUserEmail(req);
    if (!email) return res.status(401).json({ error: "Not logged in." });
    req.userEmail = email;
    next();
}

// POST /orders/create — place an order from the current cart
router.post("/create", requireEmail, async (req, res) => {
    try {
        const { paymentMethod, shippingAddress } = req.body;

        const cart = await Cart.findOne({ userEmail: req.userEmail });
        if (!cart || cart.items.length === 0)
            return res.status(400).json({ error: "Cart is empty." });

        const totalAmount = cart.items.reduce(
            (sum, item) => sum + item.price * item.quantity, 0
        );

        const order = await Order.create({
            userEmail: req.userEmail,
            items: cart.items,
            totalAmount,
            paymentMethod: paymentMethod || "credit_card",
            shippingAddress
        });

        // Clear the cart after order is placed
        await Cart.findOneAndUpdate({ userEmail: req.userEmail }, { items: [] });

        res.json({ success: true, orderId: order._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /orders/history — get all past orders for the user
router.get("/history", requireEmail, async (req, res) => {
    try {
        const orders = await Order.find({ userEmail: req.userEmail }).sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /orders/:id — single order details
router.get("/:id", requireEmail, async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, userEmail: req.userEmail });
        if (!order) return res.status(404).json({ error: "Order not found." });
        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;