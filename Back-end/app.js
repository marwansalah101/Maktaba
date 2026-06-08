require('dotenv').config({ path: '../.env' });
const express = require('express');
const path    = require('path');
const mongoose = require('mongoose');
const helmet   = require('helmet');
const rateLimit = require('express-rate-limit');
const cors     = require('cors');
const app = express();

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

/* ── Static files — serves the whole views/ folder through Express */
app.use(express.static(path.join(__dirname, '..', 'views'), { index: 'home.html' }));

/* ── Rate limiting — applied to API routes only, not static assets */
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,                  // 300 API calls per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests - please try again later.' },
});

const authController = require('./controllers/authController');

/* ── Auth endpoint ─────────────────────────────────────────────────
   Credentials are stored in .env and checked server-side.
   Admin password should be bcrypt-hashed before production use.   */
// Auth routes (login/signup/logout/me/profile/cart/favorites) are handled by
// routes/Authroutes.js, mounted under /api/auth via routes.js below.

/* ── AI Recommendation proxy ───────────────────────────────────────
   The OpenRouter API key stays server-side and is never sent to
   the browser. The SSE stream is forwarded directly to the client.  */
app.post('/api/recommend', authController.recommend);

/* ── Clean page URLs ────────────────────────────────────────────── */
const productHtmlPath    = path.join(__dirname, '..', 'views', 'pages', 'product(Marwan)', 'product.html');
const collectionHtmlPath = path.join(__dirname, '..', 'views', 'pages', 'catalog(Marwan)', 'collection.html');

app.get('/book/:slug',  (req, res) => res.sendFile(productHtmlPath));
app.get('/collection',  (req, res) => res.sendFile(collectionHtmlPath));

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
    const colors = {
        reset:  '\x1b[0m',
        green:  '\x1b[32m',
        red:    '\x1b[31m',
        yellow: '\x1b[33m',
    };

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
