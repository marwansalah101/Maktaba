const express = require('express');
const router  = express.Router();
const { signup, login, getUser, recommend } = require('../controllers/authController');

// POST /api/auth/signup
router.post('/signup', signup);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/recommend
router.post('/recommend', recommend);

// GET /api/auth/users/:id
router.get('/users/:id', getUser);

// GET /api/auth/users
router.get('/users', async (req, res, next) => {
  try {
    const User  = require('../models/User');
    const users = await User.find().select('-__v');
    res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/profile
router.get('/profile', async (req, res, next) => {
  try {
    const User  = require('../models/User');
    const email = (req.headers['x-user-email'] || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email header missing.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    res.json({ name: user.name, email: user.email });
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/update
router.put('/update', async (req, res, next) => {
  try {
    const User  = require('../models/User');
    const email = (req.headers['x-user-email'] || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email header missing.' });

    const { name, email: newEmail, password } = req.body || {};

    const updateFields = {};
    if (name)     updateFields.name  = name.trim();
    if (newEmail) updateFields.email = newEmail.trim().toLowerCase();

    let user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (updateFields.name)  user.name  = updateFields.name;
    if (updateFields.email) user.email = updateFields.email;

    if (password && password.trim().length >= 8) {
      user.password = password.trim();
      user = await user.save();
    } else {
      await User.updateOne({ email }, { $set: updateFields });
      user = await User.findOne({ email: updateFields.email || email });
    }

    res.json({ success: true, name: user.name, email: user.email });
  } catch (err) {
    next(err);
  }
});

module.exports = router;