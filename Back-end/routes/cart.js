const express = require('express');
const router  = express.Router();
const Cart    = require('../models/Cart');
const { v4: uuidv4 } = require('uuid');

// Middleware - عمل session ID لو مفيش
function getSessionId(req, res) {
  let sid = req.headers['x-session-id'];
  if (!sid) {
    sid = uuidv4();
  }
  return sid;
}

// GET /api/cart
router.get('/', async (req, res) => {
  const sessionId = getSessionId(req, res);
  try {
    const cart = await Cart.findOne({ sessionId });
    res.json({ sessionId, items: cart ? cart.items : [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/cart/add
router.post('/add', async (req, res) => {
  const sessionId = getSessionId(req, res);
  const { bookId, title, author, image, price } = req.body;

  try {
    let cart = await Cart.findOne({ sessionId });

    if (!cart) {
      cart = new Cart({ sessionId, items: [] });
    }

    const existing = cart.items.find(i => i.bookId === bookId);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.items.push({ bookId, title, author, image, price, qty: 1 });
    }

    await cart.save();
    res.json({ sessionId, cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/cart/update/:bookId
router.put('/update/:bookId', async (req, res) => {
  const sessionId = getSessionId(req, res);
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
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/cart/remove/:bookId
router.delete('/remove/:bookId', async (req, res) => {
  const sessionId = getSessionId(req, res);

  try {
    const cart = await Cart.findOne({ sessionId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(i => i.bookId !== req.params.bookId);
    await cart.save();
    res.json({ sessionId, cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/cart/clear
router.delete('/clear', async (req, res) => {
  const sessionId = getSessionId(req, res);

  try {
    await Cart.findOneAndUpdate({ sessionId }, { items: [] });
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;