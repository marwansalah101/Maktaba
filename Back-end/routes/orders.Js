const express = require("express");
const router  = express.Router();
const Order   = require("../models/Order");
const { protect } = require("../middlewares/auth");

function mapPaymentMethod(method) {
    if (!method) return "credit_card";
    const m = String(method).toLowerCase();
    if (m.includes("cash")) return "cash_on_delivery";
    if (m.includes("debit")) return "debit_card";
    return "credit_card";
}

// POST / — place an order from the checkout flow
router.post("/", async (req, res) => {
    try {
        const { customerInfo, items, shippingAddress, paymentInfo, orderSummary } = req.body;

        if (!customerInfo || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "Missing required order data." });
        }

        // Prefer JWT email over form email so orders are always linked to the account
        let userEmail = (customerInfo.email || "").toLowerCase().trim();
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            try {
                const jwt = require("jsonwebtoken");
                const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
                const User = require("../models/user");
                const user = await User.findById(decoded.id).select("email");
                if (user) userEmail = user.email.toLowerCase();
            } catch (e) { /* use form email */ }
        }

        if (!userEmail) return res.status(400).json({ error: "An email is required to place an order." });

        const addr = shippingAddress || {};
        const info = customerInfo || {};
        const summary = orderSummary || {};

        const order = await Order.create({
            userEmail,
            items: items.map(item => ({
                bookId:   item.bookId   || undefined,
                title:    item.title    || "",
                author:   item.author   || "",
                price:    parseFloat(item.price)    || 0,
                image:    item.image    || "",
                quantity: parseInt(item.quantity || item.qty || 1, 10)
            })),
            totalAmount: parseFloat(summary.total) || 0,
            paymentMethod: mapPaymentMethod(paymentInfo && paymentInfo.method),
            shippingAddress: {
                fullName: [info.firstName, info.lastName].filter(Boolean).join(" "),
                address:  [addr.street, addr.number].filter(Boolean).join(" "),
                city:     addr.place || addr.city || "",
                phone:    info.phone || ""
            }
        });

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            orderNumber: "MKTBA-" + String(order._id).slice(-6).toUpperCase(),
            orderId: order._id
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /mine — logged-in user's order history (JWT required)
router.get("/mine", protect, async (req, res) => {
    try {
        const orders = await Order.find({ userEmail: req.user.email.toLowerCase() })
            .sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /create — legacy endpoint (x-user-email header, kept for compatibility)
router.post("/create", async (req, res) => {
    try {
        const email = (req.headers["x-user-email"] || "").trim().toLowerCase();
        if (!email) return res.status(401).json({ error: "Not logged in." });

        const { paymentMethod, shippingAddress } = req.body;
        const Cart = require("../models/Cart");

        const cart = await Cart.findOne({ userEmail: email });
        if (!cart || cart.items.length === 0)
            return res.status(400).json({ error: "Cart is empty." });

        const totalAmount = cart.items.reduce(
            (sum, item) => sum + item.price * item.quantity, 0
        );

        const order = await Order.create({
            userEmail: email,
            items: cart.items,
            totalAmount,
            paymentMethod: paymentMethod || "credit_card",
            shippingAddress
        });

        await Cart.findOneAndUpdate({ userEmail: email }, { items: [] });
        res.json({ success: true, orderId: order._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /history — legacy endpoint (x-user-email header)
router.get("/history", async (req, res) => {
    try {
        const email = (req.headers["x-user-email"] || "").trim().toLowerCase();
        if (!email) return res.status(401).json({ error: "Not logged in." });
        const orders = await Order.find({ userEmail: email }).sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /:id — single order by ID
router.get("/:id", async (req, res) => {
    try {
        const email = (req.headers["x-user-email"] || "").trim().toLowerCase();
        const order = await Order.findOne({ _id: req.params.id, userEmail: email });
        if (!order) return res.status(404).json({ error: "Order not found." });
        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
