const User = require('../models/User');
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

    // ── 3. Fallback: check hard-coded admin in .env ──────────────────────────
    // (useful during development or if admin is not seeded in DB)
    const adminEmail    = (process.env.ADMIN_EMAIL    || '').toLowerCase();
    const adminPassword =  process.env.ADMIN_PASSWORD || '';

    if (adminEmail && normalizedEmail === adminEmail && password === adminPassword) {
      return res.json({ success: true, role: 'admin', email: adminEmail });
    }

    // ── 4. Nothing matched ───────────────────────────────────────────────────
    return res.status(401).json({ error: 'Incorrect email or password.' });

  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.getUser = async (req, res, next) => {
  try {
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