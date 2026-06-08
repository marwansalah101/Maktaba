const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Book = require('../models/Book');
const { protect } = require('../middlewares/auth');

// GET all orders (for admin)
router.get("/", async (req, res) => {
    try {
        const orders = await Order.find().populate('items.bookId').sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET the logged-in user's own orders (session via JWT)
router.get("/mine", protect, async (req, res) => {
    try {
        const orders = await Order.find({ 'customerInfo.email': req.user.email })
            .populate('items.bookId').sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET orders by customer email
router.get("/customer/:email", async (req, res) => {
    try {
        const orders = await Order.find({ 
            'customerInfo.email': req.params.email 
        }).populate('items.bookId').sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single order by order number
router.get("/order/:orderNumber", async (req, res) => {
    try {
        const order = await Order.findOne({ 
            orderNumber: req.params.orderNumber 
        }).populate('items.bookId');
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST - create a new order
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

        // Validate and populate book information
        const validatedItems = [];
        for (const item of items) {
            if (!item.bookId && !item.title) {
                return res.status(400).json({ error: "Each item must have either bookId or title" });
            }

            let book = null;
            if (item.bookId) {
                book = await Book.findById(item.bookId);
                if (!book) {
                    return res.status(404).json({ error: `Book with ID ${item.bookId} not found` });
                }
            }

            const validatedItem = {
                bookId: book ? book._id : null,
                title: item.title || (book ? book.title : 'Unknown'),
                author: item.author || (book ? book.author : 'Unknown'),
                price: item.price || (book ? book.price : 0),
                quantity: item.quantity || 1,
                image: item.image || (book ? book.image : '')
            };

            validatedItems.push(validatedItem);

            // Update book stock if book exists
            if (book && book.stock >= validatedItem.quantity) {
                await Book.findByIdAndUpdate(book._id, {
                    $inc: { stock: -validatedItem.quantity }
                });
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

        const savedOrder = await newOrder.save();
        
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

// PUT - update order status
router.put("/:orderNumber/status", async (req, res) => {
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

// PUT - update payment status
router.put("/:orderNumber/payment", async (req, res) => {
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

// DELETE - cancel order (soft delete by changing status)
router.delete("/:orderNumber", async (req, res) => {
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