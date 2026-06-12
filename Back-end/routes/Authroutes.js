const express = require('express');
const router  = express.Router();
const ctrl = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

// ── Public auth ──────────────────────────────────────────────────────────────
router.post('/signup',    ctrl.signup);
router.post('/login',     ctrl.login);
router.post('/logout',    ctrl.logout);
router.post('/recommend', ctrl.recommend);
router.post('/google',    ctrl.googleAuth);
router.get('/google/start',    ctrl.startGoogleAuth);
router.get('/google/callback', ctrl.handleGoogleCallback);

router.post('/forgot-password', ctrl.forgotPassword);
router.post('/verify-otp',      ctrl.verifyOtp);
router.post('/reset-password',  ctrl.resetPassword);

// ── Logged-in user's own data (session via JWT) ─────────────────────────────
router.get('/me',         protect, ctrl.getMe);
router.put('/profile',    protect, ctrl.updateProfile);
router.get('/cart',       protect, ctrl.getCart);
router.put('/cart',       protect, ctrl.updateCart);
router.get('/favorites',  protect, ctrl.getFavorites);
router.put('/favorites',  protect, ctrl.updateFavorites);

router.post('/request-verification', protect, ctrl.requestEmailVerification);
router.post('/verify-email',         protect, ctrl.verifyEmail);
router.post('/deactivate',           protect, ctrl.deactivateAccount);

// ── Lookup ───────────────────────────────────────────────────────────────────
router.get('/users/:id',  ctrl.getUser);

router.get('/users', async (req, res, next) => {
  try {
    const User = require('../models/user');
    const users = await User.find().select('-__v -password');
    res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
