const express = require('express');
const router  = express.Router();
const { signup, login, getUser, recommend } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');

// POST /api/auth/signup      → create new user account
router.post('/signup', signup);

// POST /api/auth/login       → check DB → check env admin → return token
router.post('/login', login);

// POST /api/auth/recommend   → streaming book recommendation (SSE)
router.post('/recommend', recommend);

// GET  /api/auth/users/:id   → get a user by ID  [protected]
router.get('/users/:id', protect, getUser);

// GET  /api/auth/users       → get ALL users      [admin only]
router.get('/users', protect, adminOnly, async (req, res, next) => {
  try {
    const User  = require('../models/User');
    const users = await User.find().select('-__v');
    res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
});

module.exports = router;