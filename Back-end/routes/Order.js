const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Book = require('../models/Book');
const { protect, adminOnly } = require('../middlewares/auth');

// GET all orders (admin only) — opt-in pagination via ?page/?limit
router.get("/", protect, adminOnly, async (req, res) => {
    try {
        let q = Order.find().populate('items.bookId').sort({ createdAt: -1 });
        if (req.query.page !== undefined || req.query.limit !== undefined) {
            const page  = Math.max(1, parseInt(req.query.page, 10)  || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
            q = q.skip((page - 1) * limit).limit(limit);
        }
        res.json(await q);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET the authenticated user's own orders (matched by account email)
router.get("/mine", protect, async (req, res) => {
    try {
        const orders = await Order.find({ 'customerInfo.email': req.user.email })
            .populate('items.bookId').sort({ createdAt: -1 });
        res.json({ orders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET orders by customer email — own email only, or admin
router.get("/customer/:email", protect, async (req, res) => {
    try {
        const target = String(req.params.email).toLowerCase();
        if (target !== String(req.user.email).toLowerCase() && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'You can only view your own orders.' });
        }
        const orders = await Order.find({
            'customerInfo.email': req.params.email
        }).populate('items.bookId').sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single order by order number — owner or admin only
router.get("/order/:orderNumber", protect, async (req, res) => {
    try {
        const order = await Order.findOne({
            orderNumber: req.params.orderNumber
        }).populate('items.bookId');

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        if (order.customerInfo.email.toLowerCase() !== String(req.user.email).toLowerCase()
            && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'You can only view your own orders.' });
        }
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST - create a new order (public: supports guest checkout)
router.post("/", async (req, res) => {
    try {
        const {
            customerInfo,
            items,
            shippingAddress,
            paymentInfo,
            orderSummary,
            notes
        } = req.body;

        // Validate required fields
        if (!customerInfo || !items || !shippingAddress || !paymentInfo || !orderSummary) {
            return res.status(400).json({ 
                error: "Missing required fields: customerInfo, items, shippingAddress, paymentInfo, orderSummary" 
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "Order must contain at least one item" });
        }

        // Validate items and atomically decrement stock. Track successful
        // decrements so we can roll them back if a later item is out of stock.
        const validatedItems = [];
        const decremented = []; // { bookId, quantity }

        const rollback = async () => {
            for (const d of decremented) {
                await Book.findByIdAndUpdate(d.bookId, { $inc: { stock: d.quantity } });
            }
        };

        for (const item of items) {
            if (!item.bookId && !item.title) {
                await rollback();
                return res.status(400).json({ error: "Each item must have either bookId or title" });
            }

            let book = null;
            if (item.bookId) {
                book = await Book.findById(item.bookId);
                if (!book) {
                    await rollback();
                    return res.status(404).json({ error: `Book with ID ${item.bookId} not found` });
                }
            }

            const quantity = item.quantity || 1;
            const validatedItem = {
                bookId: book ? book._id : null,
                title: item.title || (book ? book.title : 'Unknown'),
                author: item.author || (book ? book.author : 'Unknown'),
                price: item.price || (book ? book.price : 0),
                quantity,
                image: item.image || (book ? book.image : '')
            };
            validatedItems.push(validatedItem);

            // Atomic check-and-decrement: only succeeds if stock is still sufficient,
            // which prevents the check-then-update race / overselling (note §3.3).
            if (book) {
                const updated = await Book.findOneAndUpdate(
                    { _id: book._id, stock: { $gte: quantity } },
                    { $inc: { stock: -quantity } },
                    { new: true }
                );
                if (!updated) {
                    await rollback();
                    return res.status(409).json({ error: `Insufficient stock for "${book.title}"` });
                }
                decremented.push({ bookId: book._id, quantity });
            }
        }

        // Create the order
        const newOrder = new Order({
            customerInfo,
            items: validatedItems,
            shippingAddress,
            paymentInfo,
            orderSummary,
            notes: notes || "",
            status: 'confirmed'
        });

        let savedOrder;
        try {
            savedOrder = await newOrder.save();
        } catch (saveErr) {
            // Order persistence failed after stock was decremented — give it back.
            await rollback();
            throw saveErr;
        }

        // Populate the saved order before returning
        const populatedOrder = await Order.findById(savedOrder._id).populate('items.bookId');

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            order: populatedOrder,
            orderNumber: savedOrder.orderNumber
        });

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT - update order status (admin only)
router.put("/:orderNumber/status", protect, adminOnly, async (req, res) => {
    try {
        const { status, trackingNumber } = req.body;
        
        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const updateData = { status };
        if (trackingNumber) {
            updateData.trackingNumber = trackingNumber;
        }

        const updatedOrder = await Order.findOneAndUpdate(
            { orderNumber: req.params.orderNumber },
            updateData,
            { new: true }
        ).populate('items.bookId');

        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json({
            success: true,
            message: "Order status updated successfully",
            order: updatedOrder
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT - update payment status (admin only)
router.put("/:orderNumber/payment", protect, adminOnly, async (req, res) => {
    try {
        const { paymentStatus, transactionId } = req.body;
        
        const validPaymentStatuses = ['pending', 'completed', 'failed', 'refunded'];
        if (!validPaymentStatuses.includes(paymentStatus)) {
            return res.status(400).json({ error: "Invalid payment status" });
        }

        const updateData = { 'paymentInfo.status': paymentStatus };
        if (transactionId) {
            updateData['paymentInfo.transactionId'] = transactionId;
        }

        const updatedOrder = await Order.findOneAndUpdate(
            { orderNumber: req.params.orderNumber },
            updateData,
            { new: true }
        ).populate('items.bookId');

        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json({
            success: true,
            message: "Payment status updated successfully",
            order: updatedOrder
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE - cancel order (soft delete by changing status) (admin only)
router.delete("/:orderNumber", protect, adminOnly, async (req, res) => {
    try {
        const order = await Order.findOneAndUpdate(
            { orderNumber: req.params.orderNumber },
            { status: 'cancelled' },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Restore book stock
        for (const item of order.items) {
            if (item.bookId) {
                await Book.findByIdAndUpdate(item.bookId, {
                    $inc: { stock: item.quantity }
                });
            }
        }

        res.json({ 
            success: true,
            message: "Order cancelled successfully", 
            order: order 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;