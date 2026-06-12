const User = require('../models/user');
const jwt  = require('jsonwebtoken');
const emailService = require('../services/emailService');
const crypto = require('crypto');
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GOOGLE_SCOPES = 'openid email profile';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '359427593568-fp7894cehclcd6e1fnke49ca2norscai.apps.googleusercontent.com';

const normalizeReturnTo = (value) => {
  const fallback = '/home';
  const raw = String(value || '').trim();
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return fallback;
  return raw;
};

const getGoogleConfig = () => {
  const port = process.env.PORT || 3000;
  return {
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || `http://localhost:${port}/api/auth/google/callback`,
  };
};

const issueToken = (user) => jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

const attachAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const buildOAuthHash = (payload) => {
  const params = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  return `#${params.toString()}`;
};

const decodeGoogleProfile = async (accessToken) => {
  const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Unable to read Google profile.');
  }

  return res.json();
};

const upsertGoogleUser = async (profile) => {
  const email = String(profile.email || '').trim().toLowerCase();
  if (!email) {
    throw new Error('Google account did not return an email address.');
  }

  let user = await User.findOne({ $or: [{ googleId: profile.sub }, { email }] }).select('+password');

  if (user) {
    if (!user.googleId) user.googleId = profile.sub;
    user.provider = 'google';
    if (profile.picture) user.picture = profile.picture;
    if (!user.name && profile.name) user.name = profile.name;
    if (!user.password) user.password = crypto.randomBytes(32).toString('hex');
    await user.save();
    return user;
  }

  user = await User.create({
    name: profile.name || email.split('@')[0],
    email,
    password: crypto.randomBytes(32).toString('hex'),
    provider: 'google',
    googleId: profile.sub || '',
    picture: profile.picture || '',
  });

  return user;
};

const verifyGoogleIdToken = async (credential) => {
  const tokenRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(text || 'Google token verification failed.');
  }

  const payload = await tokenRes.json();
  if (payload.aud !== GOOGLE_CLIENT_ID) {
    throw new Error('Google account token was issued for a different application.');
  }

  if (payload.email_verified !== 'true' && payload.email_verified !== true) {
    throw new Error('Google account email is not verified.');
  }

  return payload;
};

// @desc  Full profile of the logged-in user (Settings, cart, favorites)
// @route GET /api/auth/me   (protect)
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @desc  Update the logged-in user's own profile (name/email/phone/password/address/payment)
// @route PUT /api/auth/profile   (protect)
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, password, address, payment } = req.body || {};
    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (name && String(name).trim()) {
      user.name = String(name).trim();
    }
    if (email && String(email).trim().toLowerCase()) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!EMAIL_RX.test(normalizedEmail)) return res.status(422).json({ error: 'Please provide a valid email.' });
      const clash = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
      if (clash) return res.status(409).json({ error: 'Email is already in use.' });
      if (user.email !== normalizedEmail) {
        user.email = normalizedEmail;
        user.isVerified = false; // Reset verification on email change
      }
    }
    if (phone !== undefined) user.phone = String(phone).trim();

    if (address && typeof address === 'object') {
      user.address = {
        fullName: String(address.fullName || '').trim(),
        street:   String(address.street   || '').trim(),
        city:     String(address.city     || '').trim(),
        phone:    String(address.phone    || '').trim(),
      };
    }
    if (payment && typeof payment === 'object') {
      // Never store the full PAN or CVV — only a masked summary.
      const digits = String(payment.cardNumber || payment.last4 || '').replace(/\D/g, '');
      user.payment = {
        method:   String(payment.method   || '').trim(),
        cardName: String(payment.cardName || '').trim(),
        expiry:   String(payment.expiry   || '').trim(),
        last4:    digits ? digits.slice(-4) : '',
      };
    }
    if (password && String(password).trim().length >= 8) {
      if (!/[A-Z]/.test(password)) {
        return res.status(422).json({ error: 'Password must contain at least one capital letter.' });
      }
      user.password = String(password).trim(); // hashed by pre-save hook
      await emailService.sendPasswordChangeEmail(user.email, user.name);
    }

    await user.save();
    const safe = user.toObject(); delete safe.password;
    res.json({ success: true, user: safe });
  } catch (err) {
    next(err);
  }
};

// @desc  Logout — clears the auth cookie
// @route POST /api/auth/logout
exports.logout = (req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
  res.status(200).json({ success: true, message: 'Logged out.' });
};

// @desc  Get / replace the logged-in user's cart
// @route GET|PUT /api/auth/cart   (protect)
exports.getCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('cart');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ success: true, cart: user.cart || [] });
  } catch (err) { next(err); }
};

exports.updateCart = async (req, res, next) => {
  try {
    const items = Array.isArray(req.body?.cart) ? req.body.cart : [];
    const cart = items.filter(i => i && i.title).map(i => ({
      title:  String(i.title),
      author: String(i.author || ''),
      image:  String(i.image  || ''),
      price:  i.price,
      originalPrice: i.originalPrice ?? i.price,
      salePrice:      i.salePrice ?? i.price,
      salePercent:    Number(i.salePercent || 0),
      isOnSale:       Boolean(i.isOnSale || (Number(i.salePrice || 0) > 0 && Number(i.originalPrice || i.price || 0) > Number(i.salePrice || 0))),
      qty:    Math.max(1, parseInt(i.qty, 10) || 1),
    }));
    const user = await User.findByIdAndUpdate(req.user.id, { cart }, { new: true }).select('cart');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ success: true, cart: user.cart });
  } catch (err) { next(err); }
};

// @desc  Get / replace the logged-in user's favorites (book titles)
// @route GET|PUT /api/auth/favorites   (protect)
exports.getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('favorites');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ success: true, favorites: user.favorites || [] });
  } catch (err) { next(err); }
};

exports.updateFavorites = async (req, res, next) => {
  try {
    const raw = Array.isArray(req.body?.favorites) ? req.body.favorites : [];
    const favorites = [...new Set(raw.map(t => String(t)).filter(Boolean))];
    const user = await User.findByIdAndUpdate(req.user.id, { favorites }, { new: true }).select('favorites');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ success: true, favorites: user.favorites });
  } catch (err) { next(err); }
};

// ── Helper: sign JWT and send response ───────────────────────────────────────
const sendToken = (user, statusCode, res) => {
  const token = issueToken(user);
  attachAuthCookie(res, token);

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

exports.startGoogleAuth = (req, res) => {
  const { clientId, redirectUri } = getGoogleConfig();

  if (!clientId || !redirectUri) {
    return res.status(500).json({
      error: 'Google sign-in is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.',
    });
  }

  const returnTo = normalizeReturnTo(req.query.returnTo || (req.query.flow === 'signup' ? '/signup' : '/signin'));
  const state = jwt.sign({ returnTo }, process.env.JWT_SECRET, { expiresIn: '10m' });

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_SCOPES,
    access_type: 'offline',
    prompt: 'select_account',
    include_granted_scopes: 'true',
    state,
  }).toString();

  return res.redirect(authUrl.toString());
};

exports.handleGoogleCallback = async (req, res, next) => {
  try {
    const { code, state, error } = req.query || {};

    if (error) {
      return res.redirect('/signin?google=cancelled');
    }

    if (!code || !state) {
      return res.redirect('/signin?google=missing');
    }

    let payload;
    try {
      payload = jwt.verify(String(state), process.env.JWT_SECRET);
    } catch {
      return res.redirect('/signin?google=invalid-state');
    }

    const { clientId, clientSecret, redirectUri } = getGoogleConfig();
    if (!clientId || !clientSecret || !redirectUri) {
      return res.redirect('/signin?google=not-configured');
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      throw new Error(text || 'Google token exchange failed.');
    }

    const tokenData = await tokenRes.json();
    const profile = await decodeGoogleProfile(tokenData.access_token);

    if (profile.email_verified === false) {
      return res.redirect('/signin?google=unverified');
    }

    const user = await upsertGoogleUser(profile);
    const token = issueToken(user);
    attachAuthCookie(res, token);

    const returnTo = normalizeReturnTo(payload.returnTo || '/home');
    const hash = buildOAuthHash({
      id: user._id,
      token,
      name: user.name,
      email: user.email,
      role: user.role,
      picture: user.picture || profile.picture || '',
      provider: 'google',
    });

    return res.redirect(`${returnTo}${hash}`);
  } catch (err) {
    next(err);
  }
};

exports.googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body || {};
    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required.' });
    }

    const profile = await verifyGoogleIdToken(String(credential));
    const user = await upsertGoogleUser({
      sub: profile.sub,
      email: profile.email,
      name: profile.name || profile.given_name || profile.email,
      picture: profile.picture || '',
    });

    return sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
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

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one capital letter.' });
    }

    // Check duplicate email
    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email is already registered.' });
    }

    // Create user — password is hashed by the pre-save hook
    const user = await User.create({ name, email, password, phone });
    
    // Send welcome email asynchronously
    emailService.sendWelcomeEmail(user.email, user.name);

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
      const adminToken = jwt.sign(
        { id: 'env-admin', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      res.cookie('token', adminToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return res.json({
        success: true,
        token: adminToken,
        role: 'admin',
        user: { id: 'env-admin', name: 'Admin', email: adminEmail, role: 'admin' }
      });
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
        model:      'openai/gpt-4o-mini',
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

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Forgot Password - send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ error: 'There is no user with that email address.' });

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set OTP and expiration (10 minutes)
    user.resetPasswordOtp = otp;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    // Send email
    const emailSent = await emailService.sendPasswordResetOtp(user.email, otp);
    if (!emailSent) {
      user.resetPasswordOtp = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ error: 'Email could not be sent' });
    }

    res.status(200).json({ success: true, data: 'Email sent' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required.' });

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      resetPasswordOtp: otp,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    res.status(200).json({ success: true, data: 'OTP verified' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ error: 'Password must contain at least one capital letter.' });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      resetPasswordOtp: otp,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, data: 'Password updated' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Request Email Verification OTP
// @route   POST /api/auth/request-verification
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.requestEmailVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (user.isVerified) {
      return res.status(400).json({ error: 'Email is already verified.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verifyEmailOtp = otp;
    user.verifyEmailExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    await emailService.sendEmailVerificationOtp(user.email, otp);

    res.status(200).json({ success: true, message: 'Verification code sent to your email.' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Verify Email using OTP
// @route   POST /api/auth/verify-email
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.verifyEmail = async (req, res, next) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ error: 'OTP is required.' });

    const user = await User.findOne({
      _id: req.user.id,
      verifyEmailOtp: otp,
      verifyEmailExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    user.isVerified = true;
    user.verifyEmailOtp = undefined;
    user.verifyEmailExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Email successfully verified.', isVerified: true });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Deactivate Account
// @route   POST /api/auth/deactivate
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.deactivateAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.isActive = false;
    await user.save();

    // Clear the cookie just like logout
    res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
    res.status(200).json({ success: true, message: 'Account deactivated successfully.' });
  } catch (err) {
    next(err);
  }
};
