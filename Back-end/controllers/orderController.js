const Order = require('../models/Order');
const Cart  = require('../models/Cart');
const User  = require('../models/user');
const jwt   = require('jsonwebtoken');

function mapPaymentMethod(method) {
    if (!method) return 'credit_card';
    const m = String(method).toLowerCase();
    if (m.includes('cash'))  return 'cash_on_delivery';
    if (m.includes('debit')) return 'debit_card';
    return 'credit_card';
}

exports.placeOrder = async (req, res, next) => {
    try {
        const { customerInfo, items, shippingAddress, paymentInfo, orderSummary } = req.body;

        if (!customerInfo || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Missing required order data.' });
        }

        let userEmail = (customerInfo.email || '').toLowerCase().trim();
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
                const user = await User.findById(decoded.id).select('email');
                if (user) userEmail = user.email.toLowerCase();
            } catch (e) { /* use form email */ }
        }

        if (!userEmail) return res.status(400).json({ error: 'An email is required to place an order.' });

        const addr    = shippingAddress || {};
        const info    = customerInfo    || {};
        const summary = orderSummary    || {};

        const order = await Order.create({
            userEmail,
            items: items.map(item => ({
                bookId:   item.bookId   || undefined,
                title:    item.title    || '',
                author:   item.author   || '',
                price:    parseFloat(item.price)    || 0,
                originalPrice: parseFloat(item.originalPrice ?? item.price) || 0,
                salePrice:     parseFloat(item.salePrice ?? item.price) || 0,
                salePercent:   Number(item.salePercent || 0),
                isOnSale:      Boolean(item.isOnSale || ((parseFloat(item.salePrice ?? item.price) || 0) > 0 && (parseFloat(item.originalPrice ?? item.price) || 0) > (parseFloat(item.salePrice ?? item.price) || 0))),
                image:    item.image    || '',
                quantity: parseInt(item.quantity || item.qty || 1, 10),
            })),
            totalAmount:    parseFloat(summary.total) || 0,
            paymentMethod:  mapPaymentMethod(paymentInfo && paymentInfo.method),
            shippingAddress: {
                fullName: [info.firstName, info.lastName].filter(Boolean).join(' '),
                address:  [addr.street, addr.number].filter(Boolean).join(' '),
                city:     addr.place || addr.city || '',
                phone:    info.phone || '',
            },
        });

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            orderNumber: 'MKTBA-' + String(order._id).slice(-6).toUpperCase(),
            orderId: order._id,
        });
    } catch (err) {
        next(err);
    }
};

exports.getMyOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ userEmail: req.user.email.toLowerCase() })
            .sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (err) {
        next(err);
    }
};

exports.createFromCart = async (req, res, next) => {
    try {
        const email = req.user.email.toLowerCase();
        const { paymentMethod, shippingAddress } = req.body;

        const cart = await Cart.findOne({ userEmail: email });
        if (!cart || cart.items.length === 0)
            return res.status(400).json({ error: 'Cart is empty.' });

        const totalAmount = cart.items.reduce(
            (sum, item) => sum + item.price * (item.qty || item.quantity || 1), 0
        );

        const order = await Order.create({
            userEmail: email,
            items: cart.items,
            totalAmount,
            paymentMethod: paymentMethod || 'credit_card',
            shippingAddress,
        });

        await Cart.findOneAndUpdate({ userEmail: email }, { items: [] });
        res.json({ success: true, orderId: order._id });
    } catch (err) {
        next(err);
    }
};

exports.getOrderHistory = async (req, res, next) => {
    try {
        const email  = req.user.email.toLowerCase();
        const orders = await Order.find({ userEmail: email }).sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (err) {
        next(err);
    }
};

exports.getOrderById = async (req, res, next) => {
    try {
        const email = req.user.email.toLowerCase();
        const order = await Order.findOne({ _id: req.params.id, userEmail: email });
        if (!order) return res.status(404).json({ error: 'Order not found.' });
        res.json({ success: true, order });
    } catch (err) {
        next(err);
    }
};

exports.updateStatus = async (req, res, next) => {
    try {
        const allowed = ['processing', 'shipped', 'delivered', 'cancelled', 'rejected', 'successful'];
        const { status } = req.body;
        if (!status || !allowed.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` });
        }
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { orderStatus: status },
            { new: true, select: 'orderNumber orderStatus' }
        );
        if (!order) return res.status(404).json({ error: 'Order not found.' });
        res.json({ success: true, orderNumber: order.orderNumber, orderStatus: order.orderStatus });
    } catch (err) {
        next(err);
    }
};
