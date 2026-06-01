const express = require('express');
const router  = express.Router();
const {
  signup, login, logout, getUser, recommend,
  getFavorites, addFavorite, removeFavorite,
  getMe, updateProfile, changePassword, getCart, updateCart,
  getMyFavorites, addMyFavorite, removeMyFavorite,
} = require('../controllers/authController');
const { protect, adminOnly } = require('../middlewares/auth');

// POST /api/auth/signup  → create new user account
router.post('/signup', signup);

// POST /api/auth/login   → returns JWT token in response body
router.post('/login', login);

// POST /api/auth/logout  → clears the auth cookie
router.post('/logout', logout);

// POST /api/auth/recommend → streaming book recommendation (SSE)
router.post('/recommend', recommend);

// ── Logged-in user's own account (keyed off the JWT, no id needed) ──────────
router.get('/me',          protect, getMe);
router.put('/profile',     protect, updateProfile);
router.put('/password',    protect, changePassword);
router.get('/cart',        protect, getCart);
router.put('/cart',        protect, updateCart);
router.get('/favorites',            protect, getMyFavorites);
router.post('/favorites/:bookId',   protect, addMyFavorite);
router.delete('/favorites/:bookId', protect, removeMyFavorite);

// ── Favorites by explicit user id — own list only (admins may act on any) ───
router.get('/users/:id/favorites',              protect, getFavorites);
router.post('/users/:id/favorites/:bookId',     protect, addFavorite);
router.delete('/users/:id/favorites/:bookId',   protect, removeFavorite);

// GET  /api/auth/users/:id → get a user by ID  [protected + ownership]
router.get('/users/:id', protect, getUser);

// GET  /api/auth/users     → get ALL users      [admin only]
router.get('/users', protect, adminOnly, async (req, res, next) => {
  try {
    const User  = require('../models/user');
    const users = await User.find().select('-__v');
    res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
});

module.exports = router;