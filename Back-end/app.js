const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const mongoose = require('mongoose');
const helmet   = require('helmet');
const rateLimit = require('express-rate-limit');
const cors     = require('cors');
const app = express();
const colors = {
    reset:  '\x1b[0m',
    green:  '\x1b[32m',
    red:    '\x1b[31m',
    yellow: '\x1b[33m',
};

/* ── Security headers ──────────────────────────────────────────────
   Disable CSP and cross-origin policies here because the frontend
   uses inline <script> tags throughout. Configure CSP properly
   before production deployment.                                    */
    app.use(helmet({
        contentSecurityPolicy:      false,
        crossOriginOpenerPolicy:    false,
        crossOriginResourcePolicy:  false,
    }));

/* ── CORS ──────────────────────────────────────────────────────── */
app.use(cors());

/* ── Body parsing ──────────────────────────────────────────────── */
app.use(express.json());

/* ── Clean page URLs ────────────────────────────────────────── */
const viewsDir = path.join(__dirname, '..', 'views');

const slugify = (value) => String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const pagePaths = {
    home:        path.join(viewsDir, 'home.html'),
    browse:      path.join(viewsDir, 'pages', 'catalog(Marwan)',     'genres.html'),
    collection:  path.join(viewsDir, 'pages', 'catalog(Marwan)',     'collection.html'),
    authors:     path.join(viewsDir, 'pages', 'home(fares)',         'AllAuthors..html'),
    authorSlug:  path.join(viewsDir, 'pages', 'catalog(Marwan)',     'authors.html'),
    product:     path.join(viewsDir, 'pages', 'product(Marwan)',     'product.html'),
    cart:        path.join(viewsDir, 'pages', 'checkout(Rojeh)',     'add-to-cart.html'),
    checkout:    path.join(viewsDir, 'pages', 'checkout(Rojeh)',     'checkout.html'),
    payment:     path.join(viewsDir, 'pages', 'checkout(Rojeh)',     'payment.html'),
    orderSuccess:path.join(viewsDir, 'pages', 'checkout(Rojeh)',     'order-success.html'),
    favorites:   path.join(viewsDir, 'pages', 'account(Mikha)',      'favorites.html'),
    settings:    path.join(viewsDir, 'pages', 'account(Mikha)',      'settings.html'),
    contact:     path.join(viewsDir, 'pages', 'account(Mikha)',      'contact-us.html'),
    signin:      path.join(viewsDir, 'pages', 'authentication(Ali)', 'signin.html'),
    signup:      path.join(viewsDir, 'pages', 'authentication(Ali)', 'signup.html'),
    dashboard:   path.join(viewsDir, 'pages', 'authentication(Ali)', 'dashboard.html'),
    privacy:     path.join(viewsDir, 'pages', 'legal(fares)',        'privacy-policy.html'),
    terms:       path.join(viewsDir, 'pages', 'legal(fares)',        'terms-of-use.html'),
    returns:     path.join(viewsDir, 'pages', 'legal(fares)',        'returns-policy.html'),
    authbooks:   path.join(viewsDir, 'pages', 'authentication(Ali)', 'authbooks.html'),
    totalauth:   path.join(viewsDir, 'pages', 'authentication(Ali)', 'totalauth.html'),
};

const serve = (key) => (req, res) => res.sendFile(pagePaths[key]);

/* Legacy .html paths use parentheses — Express 5 route syntax cannot
   register them, so redirect via req.path lookup before page routes. */
const legacyPathMap = {
    '/home.html': '/home',
    '/pages/catalog(Marwan)/genres.html': '/browse',
    '/pages/catalog(Marwan)/collection.html': '/collection',
    '/pages/home(fares)/AllAuthors.html': '/authors',
    '/pages/account(Mikha)/favorites.html': '/favorites',
    '/pages/account(Mikha)/settings.html': '/settings',
    '/pages/account(Mikha)/contact-us.html': '/contact',
    '/pages/checkout(Rojeh)/add-to-cart.html': '/cart',
    '/pages/checkout(Rojeh)/checkout.html': '/checkout',
    '/pages/checkout(Rojeh)/payment.html': '/payment',
    '/pages/checkout(Rojeh)/order-success.html': '/order-success',
    '/pages/legal(fares)/privacy-policy.html': '/privacy',
    '/pages/legal(fares)/terms-of-use.html': '/terms',
    '/pages/legal(fares)/returns-policy.html': '/returns',
    '/pages/authentication(Ali)/signin.html': '/signin',
    '/pages/authentication(Ali)/signup.html': '/signup',
    '/pages/authentication(Ali)/dashboard.html': '/dashboard',
    '/pages/authentication(Ali)/authbooks.html': '/authbooks',
    '/pages/authentication(Ali)/totalauth.html': '/totalauth',
};

app.use((req, res, next) => {
    if (req.method !== 'GET') return next();

    const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';

    if (req.path === '/pages/product(Marwan)/product.html') {
        const title = req.query.title ? slugify(req.query.title) : '';
        if (title) return res.redirect(`/book/${title}`);
        return res.redirect('/collection');
    }

    if (req.path === '/pages/catalog(Marwan)/authors.html') {
        const slug = req.query.slug ? slugify(req.query.slug) : '';
        const genre = req.query.genre || '';
        if (slug) return res.redirect(`/author/${slug}` + (genre ? `?genre=${encodeURIComponent(genre)}` : ''));
        if (genre) return res.redirect(`/collection${query}`);
        return res.redirect('/authors');
    }

    const target = legacyPathMap[req.path];
    if (target) return res.redirect(target + query);

    next();
});

// Home
app.get('/home',          serve('home'));
app.get('/',              serve('home'));

// Browse / Genres
app.get('/browse',        serve('browse'));

// Collection
app.get('/collection',    serve('collection'));

// Authors
app.get('/authors',       serve('authors'));
app.get('/author/:slug',  serve('authorSlug'));

// Product (book)
app.get('/book/:slug',    serve('product'));

// Admin pages
app.get('/authbooks',     serve('authbooks'));
app.get('/totalauth',     serve('totalauth'));

// Cart & Checkout
app.get('/cart',          serve('cart'));
app.get('/checkout',      serve('checkout'));
app.get('/payment',       serve('payment'));
app.get('/order-success', serve('orderSuccess'));

// Account
app.get('/favorites',     serve('favorites'));
app.get('/settings',      serve('settings'));
app.get('/contact',       serve('contact'));

// Auth
app.get('/signin',        serve('signin'));
app.get('/signup',        serve('signup'));
app.get('/dashboard',     serve('dashboard'));

// Legal
app.get('/privacy',       serve('privacy'));
app.get('/terms',         serve('terms'));
app.get('/returns',       serve('returns'));

/* ── Static assets (CSS, JS, images) — after clean page routes ─── */
app.use(express.static(path.join(__dirname, '..', 'views'), { index: false }));

/* ── Rate limiting — applied to API routes only, not static assets */
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,                  // 300 API calls per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests - please try again later.' },
});

const authController = require('./controllers/authController');

/* ── AI Recommendation proxy ───────────────────────────────────────
   The OpenRouter API key stays server-side and is never sent to
   the browser. The SSE stream is forwarded directly to the client.  */
app.post('/api/recommend', authController.recommend);

/* ── API routes — rate limiter applied here, after static files ────
   routes.js mounts:  /books         → books.js
                      /api/authors   → Authors.js              */
const routes = require('./routes/routes');
app.use('/api', limiter);   // protects /api/authors, /api/recommend, /api/auth/login
app.use('/books', limiter); // protects /books
app.use('/', routes);

/* ── 404 handler — catches any route that nothing above matched ── */
app.use((req, res) => {
    res.status(404).json({ error: `Cannot ${req.method} ${req.path}` });
});

/* ── Global error handler ───────────────────────────────────────
   Four-parameter signature is required by Express to recognise
   this as an error handler (the err argument is the first).     */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.path} -`, err.message);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
});

/* ── MongoDB connection ─────────────────────────────────────────── */
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS:          45000,
            connectTimeoutMS:         30000,
            heartbeatFrequencyMS:     2000,
            maxPoolSize:              10,
        });
        console.log(`${colors.green}MongoDB connected${colors.reset}`);
    } catch (err) {
        console.log(`${colors.red}MongoDB connection error: ${err.message}${colors.reset}`);
        console.log(`${colors.yellow}Retrying in 5 seconds...${colors.reset}`);
        setTimeout(connectDB, 5000);
    }
};

connectDB();

mongoose.connection.on('disconnected', () => {
    console.log(`${colors.red}MongoDB disconnected - reconnecting...${colors.reset}`);
    setTimeout(connectDB, 5000);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
