const path     = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express  = require('express');
const mongoose = require('mongoose');
const helmet   = require('helmet');
const rateLimit = require('express-rate-limit');
const cors     = require('cors');
const app = express();

const isProd = process.env.NODE_ENV === 'production';

/* ── Security headers ──────────────────────────────────────────────
   Relaxed CSP: the frontend relies on inline <script>/<style> tags, so
   'unsafe-inline' is permitted (note §1.5). External origins actually
   used by the app are explicitly allow-listed. Tightening to a strict
   nonce-based CSP would require moving every inline script to a file.  */
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc:  ["'self'"],
            scriptSrc:   ["'self'", "'unsafe-inline'", 'https://accounts.google.com', 'https://apis.google.com', 'https://cdn.jsdelivr.net'],
            // The frontend uses inline on* event-handler attributes (onclick, etc.).
            // 'unsafe-inline' in script-src does NOT cover these — script-src-attr must
            // allow them explicitly, or every inline handler is blocked by CSP.
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc:    ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc:     ["'self'", 'https://fonts.gstatic.com', 'data:'],
            imgSrc:      ["'self'", 'data:', 'https:'],
            connectSrc:  ["'self'", 'https://accounts.google.com'],
            frameSrc:    ["'self'", 'https://accounts.google.com'],
            objectSrc:   ["'none'"],
        },
    },
    // Allow images/uploads to be embedded cross-origin where needed.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    // Google Sign-In popups need a relaxed opener policy.
    crossOriginOpenerPolicy:   { policy: 'same-origin-allow-popups' },
}));

/* ── CORS ───────────────────────────────────────────────────────────
   In production, restrict to the configured frontend origin(s); in dev,
   reflect the request origin. The frontend is same-origin (served by
   Express) so this only matters for external API consumers (note §1.6). */
const allowedOrigins = (process.env.ALLOWED_ORIGIN || '')
    .split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
    origin: isProd ? (allowedOrigins.length ? allowedOrigins : false) : true,
    credentials: true,
}));

/* ── Body parsing ──────────────────────────────────────────────── */
app.use(express.json());

/* ── Health check ─────────────────────────────────────────────────
   Returns 200 with DB connection state for load balancers / uptime
   monitors (note §6.3). readyState 1 === connected.                  */
app.get('/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    res.status(dbState === 1 ? 200 : 503).json({
        status: dbState === 1 ? 'ok' : 'degraded',
        db: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown',
        uptime: process.uptime(),
    });
});

/* ── Static files — serves the whole views/ folder through Express */
app.use(express.static(path.join(__dirname, '..', 'views'), { index: 'home.html' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ── Rate limiting ─────────────────────────────────────────────────
   Global limiter for the API, plus a stricter limiter targeting the
   auth endpoints to slow brute-force / credential-stuffing (note §1.7). */
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,                  // 300 API calls per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests — please try again later.' },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,                   // 10 login/signup attempts per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts — please try again later.' },
});

/* ── AI Recommendation proxy ───────────────────────────────────────
   The OpenRouter API key stays server-side and is never sent to the
   browser. The SSE stream is forwarded directly to the client.        */
const authController = require('./controllers/authController');
app.post('/api/recommend', limiter, authController.recommend);

/* ── Clean page URLs ────────────────────────────────────────────── */
const productHtmlPath    = path.join(__dirname, '..', 'views', 'pages', 'product(Marwan)', 'product.html');
const collectionHtmlPath = path.join(__dirname, '..', 'views', 'pages', 'catalog(Marwan)', 'collection.html');

app.get('/book/:slug',  (req, res) => res.sendFile(productHtmlPath));
app.get('/collection',  (req, res) => res.sendFile(collectionHtmlPath));

/* ── API routes ────────────────────────────────────────────────────
   Stricter limiter on the auth endpoints first, then the global API
   limiter, then the routers. Login/signup are defined once, in
   Authroutes.js (mounted under /api/auth via routes.js) — no longer
   duplicated here (note §2.5).                                         */
const routes = require('./routes/routes');
app.use(['/api/auth/login', '/api/auth/signup'], authLimiter);
app.use('/api', limiter);
app.use('/books', limiter);
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
    console.error(`[ERROR] ${req.method} ${req.path} —`, err.message);
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
        console.log('MongoDB connected');
    } catch (err) {
        console.log('MongoDB connection error:', err.message);
        setTimeout(connectDB, 5000);
    }
};

connectDB();

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected — reconnecting...');
    setTimeout(connectDB, 5000);
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

/* ── Graceful shutdown ─────────────────────────────────────────────
   Stop accepting connections, drain in-flight requests, then close the
   DB connection so a process kill can't corrupt an in-flight write
   (note §6.2).                                                          */
const shutdown = (signal) => {
    console.log(`${signal} received — shutting down gracefully`);
    server.close(() => {
        mongoose.connection.close(false).finally(() => {
            console.log('Closed out remaining connections');
            process.exit(0);
        });
    });
    // Force-exit if shutdown hangs.
    setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
