const Cart = require('../models/Cart');
const { v4: uuidv4 } = require('uuid');

function getSessionId(req) {
    return req.headers['x-session-id'] || uuidv4();
}

exports.getCart = async (req, res, next) => {
    const sessionId = getSessionId(req);
    try {
        const cart = await Cart.findOne({ sessionId });
        res.json({ sessionId, items: cart ? cart.items : [] });
    } catch (err) {
        next(err);
    }
};

exports.addToCart = async (req, res, next) => {
    const sessionId = getSessionId(req);
    const { bookId, title, author, image, price } = req.body;
    try {
        let cart = await Cart.findOne({ sessionId });
        if (!cart) cart = new Cart({ sessionId, items: [] });

        const existing = cart.items.find(i => i.bookId === bookId);
        if (existing) {
            existing.qty += 1;
        } else {
            cart.items.push({ bookId, title, author, image, price, qty: 1 });
        }

        await cart.save();
        res.json({ sessionId, cart });
    } catch (err) {
        next(err);
    }
};

exports.updateCartItem = async (req, res, next) => {
    const sessionId = getSessionId(req);
    const { qty } = req.body;
    try {
        const cart = await Cart.findOne({ sessionId });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        const item = cart.items.find(i => i.bookId === req.params.bookId);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        if (qty < 1) {
            cart.items = cart.items.filter(i => i.bookId !== req.params.bookId);
        } else {
            item.qty = qty;
        }

        await cart.save();
        res.json({ sessionId, cart });
    } catch (err) {
        next(err);
    }
};

exports.removeFromCart = async (req, res, next) => {
    const sessionId = getSessionId(req);
    try {
        const cart = await Cart.findOne({ sessionId });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        cart.items = cart.items.filter(i => i.bookId !== req.params.bookId);
        await cart.save();
        res.json({ sessionId, cart });
    } catch (err) {
        next(err);
    }
};

exports.clearCart = async (req, res, next) => {
    const sessionId = getSessionId(req);
    try {
        await Cart.findOneAndUpdate({ sessionId }, { items: [] });
        res.json({ message: 'Cart cleared' });
    } catch (err) {
        next(err);
    }
};
