const User = require('../models/user');
const jwt  = require('jsonwebtoken');

// ── Helper: sign JWT and send response ───────────────────────────────────────
const sendToken = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000,
  });

  res.status(statusCode).json({
    success: true,
    token,
    role: user.role,
    user: {
      id:    user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }

    // Check duplicate email
    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email is already registered.' });
    }

    // Create user — password is hashed by the pre-save hook
    const user = await User.create({ name, email, password, phone });

    sendToken(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Login — checks DB first, falls back to admin env vars
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ── 2. Check database first ──────────────────────────────────────────────
    // password field is select:false in schema — must opt-in explicitly
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (user) {
      // User found — verify password against bcrypt hash
      const isMatch = await user.matchPassword(password);

      if (!isMatch) {
        return res.status(401).json({ error: 'Incorrect email or password.' });
      }

      // Password correct — send token
      return sendToken(user, 200, res);
    }

    // ── 3. Nothing matched ───────────────────────────────────────────────────
    // No env-based plaintext fallback: admin accounts live in the DB with a
    // bcrypt-hashed password and the 'admin' role, and authenticate here too.
    return res.status(401).json({ error: 'Incorrect email or password.' });

  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Logout — clears the auth cookie
// @route   POST /api/auth/logout
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.status(200).json({ success: true, message: 'Logged out.' });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.getUser = async (req, res, next) => {
  try {
    // Ownership check: a user may only fetch their own profile; admins fetch any.
    if (req.params.id !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only access your own profile.' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json({ success: true, user });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid user ID format.' });
    }
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  Favorites — a user's saved books (own list only; admins may act on any user)
//  Routes: GET/POST/DELETE /api/auth/users/:id/favorites[/:bookId]
// ─────────────────────────────────────────────────────────────────────────────
const ownsOrAdmin = (req) =>
  req.params.id === String(req.user.id) || req.user.role === 'admin';

exports.getFavorites = async (req, res, next) => {
  try {
    if (!ownsOrAdmin(req)) {
      return res.status(403).json({ error: 'You can only access your own favorites.' });
    }
    const user = await User.findById(req.params.id).populate('favorites');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.status(200).json({ success: true, favorites: user.favorites });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format.' });
    }
    next(err);
  }
};

exports.addFavorite = async (req, res, next) => {
  try {
    if (!ownsOrAdmin(req)) {
      return res.status(403).json({ error: 'You can only modify your own favorites.' });
    }
    // $addToSet prevents duplicate entries
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { favorites: req.params.bookId } },
      { new: true }
    ).populate('favorites');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.status(200).json({ success: true, favorites: user.favorites });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format.' });
    }
    next(err);
  }
};

exports.removeFavorite = async (req, res, next) => {
  try {
    if (!ownsOrAdmin(req)) {
      return res.status(403).json({ error: 'You can only modify your own favorites.' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $pull: { favorites: req.params.bookId } },
      { new: true }
    ).populate('favorites');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.status(200).json({ success: true, favorites: user.favorites });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format.' });
    }
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  Account — the authenticated user's own profile / cart / favorites
//  All keyed off req.user (set by `protect`), so no IDs leak across users.
// ─────────────────────────────────────────────────────────────────────────────

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// @desc  Full profile of the logged-in user
// @route GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-cart');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @desc  Update own profile (name, email, phone, address, payment)
// @route PUT /api/auth/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, address, payment } = req.body || {};
    const update = {};

    if (name !== undefined) {
      if (String(name).trim().length < 2) {
        return res.status(422).json({ error: 'Name must be at least 2 characters.' });
      }
      update.name = String(name).trim();
    }

    if (email !== undefined) {
      const normalized = String(email).trim().toLowerCase();
      if (!EMAIL_RX.test(normalized)) {
        return res.status(422).json({ error: 'Please provide a valid email.' });
      }
      // Reject if another account already uses this email.
      const clash = await User.findOne({ email: normalized, _id: { $ne: req.user.id } });
      if (clash) return res.status(409).json({ error: 'Email is already in use.' });
      update.email = normalized;
    }

    if (phone !== undefined) update.phone = String(phone).trim();

    if (address && typeof address === 'object') {
      update.address = {
        fullName: String(address.fullName || '').trim(),
        street:   String(address.street   || '').trim(),
        city:     String(address.city     || '').trim(),
        phone:    String(address.phone    || '').trim(),
      };
    }

    if (payment && typeof payment === 'object') {
      // Only a masked summary is stored — never the full PAN or CVV.
      const digits = String(payment.cardNumber || '').replace(/\D/g, '');
      update.payment = {
        method:   String(payment.method   || '').trim(),
        cardName: String(payment.cardName || '').trim(),
        expiry:   String(payment.expiry   || '').trim(),
        last4:    digits ? digits.slice(-4) : String(payment.last4 || '').slice(-4),
      };
    }

    const user = await User.findByIdAndUpdate(req.user.id, update, {
      new: true, runValidators: true,
    }).select('-cart');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @desc  Change own password (requires the current password)
// @route PUT /api/auth/password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required.' });
    }
    if (String(newPassword).length < 8) {
      return res.status(422).json({ error: 'New password must be at least 8 characters.' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const ok = await user.matchPassword(currentPassword);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect.' });

    user.password = newPassword; // hashed by the pre-save hook
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated.' });
  } catch (err) {
    next(err);
  }
};

// @desc  Get the logged-in user's server-side cart
// @route GET /api/auth/cart
exports.getCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('cart');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.status(200).json({ success: true, items: user.cart });
  } catch (err) {
    next(err);
  }
};

// @desc  Replace the logged-in user's cart with the supplied items
// @route PUT /api/auth/cart   body: { items: [...] }
exports.updateCart = async (req, res, next) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const cart = items
      .filter(i => i && i.title)
      .map(i => ({
        bookId: String(i.bookId || ''),
        title:  String(i.title),
        author: String(i.author || ''),
        image:  String(i.image  || ''),
        price:  Number(i.price) || 0,
        qty:    Math.max(1, parseInt(i.qty, 10) || 1),
      }));

    const user = await User.findByIdAndUpdate(
      req.user.id, { cart }, { new: true }
    ).select('cart');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    res.status(200).json({ success: true, items: user.cart });
  } catch (err) {
    next(err);
  }
};

// ── Favorites keyed off the logged-in user (no :id needed) ──────────────────
exports.getMyFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('favorites');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.status(200).json({ success: true, favorites: user.favorites });
  } catch (err) {
    next(err);
  }
};

exports.addMyFavorite = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { favorites: req.params.bookId } },
      { new: true }
    ).populate('favorites');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.status(200).json({ success: true, favorites: user.favorites });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid book ID.' });
    next(err);
  }
};

exports.removeMyFavorite = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { favorites: req.params.bookId } },
      { new: true }
    ).populate('favorites');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.status(200).json({ success: true, favorites: user.favorites });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid book ID.' });
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Book recommendation via OpenRouter (streaming SSE) — unchanged
// @route   POST /api/auth/recommend
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.recommend = async (req, res, next) => {
  const { message, books } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: 'message is required.' });
  }

  let systemPrompt =
    'You are a book recommendation assistant for Maktaba, an online bookstore. ' +
    'When the user describes what they want — a theme, mood, feeling, or topic — ' +
    'find the books from our catalogue that best match that description and recommend 3 to 5 of them. ' +
    'Use your knowledge of each book\'s themes, tone, and story to judge the fit, not just the genre label. ' +
    'For each recommendation give the title in quotes, the author, and one sentence explaining why it matches. ' +
    'Write in plain, warm prose. No bullet points, no markdown headers, no numbered lists.';

  if (Array.isArray(books) && books.length > 0) {
    const list = books.map(b => `"${b.title}" by ${b.author} (${b.genre})`).join(', ');
    systemPrompt += ` Our full catalogue (only recommend from this list): ${list}.`;
  }

  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type':  'application/json',
        'HTTP-Referer':  req.headers.referer || req.headers.origin || 'http://localhost:3000',
        'X-Title':       'Maktaba',
      },
      body: JSON.stringify({
        model:      'openai/gpt-oss-120b',
        stream:     true,
        max_tokens: 600,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: message },
        ],
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return res.status(upstream.status).json({ error: errText });
    }

    res.setHeader('Content-Type',  'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection',    'keep-alive');

    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (err) {
    if (!res.headersSent) next(err);
  }
};