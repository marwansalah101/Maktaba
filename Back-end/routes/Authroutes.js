const express = require('express');
const router  = express.Router();
const ctrl = require('../controllers/authController');
const { protect, adminOnly } = require('../middlewares/auth');
const { signupRules, loginRules, validate } = require('../middlewares/validators');

// ── Public auth ──────────────────────────────────────────────────────────────
router.post('/signup',    signupRules, validate, ctrl.signup);
router.post('/login',     loginRules,  validate, ctrl.login);
router.post('/logout',    ctrl.logout);
router.post('/recommend', ctrl.recommend);

// ── Logged-in user's own data (session via JWT) ─────────────────────────────
router.get('/me',         protect, ctrl.getMe);
router.put('/profile',    protect, ctrl.updateProfile);
router.get('/cart',       protect, ctrl.getCart);
router.put('/cart',       protect, ctrl.updateCart);
router.get('/favorites',  protect, ctrl.getFavorites);
router.put('/favorites',  protect, ctrl.updateFavorites);

// ── Admin-only user lookup ────────────────────────────────────────────────────
router.get('/users/:id',  protect, adminOnly, ctrl.getUser);

router.get('/users', protect, adminOnly, async (req, res, next) => {
  try {
    const User  = require('../models/user');
    const users = await User.find().select('-__v -password');
    res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
