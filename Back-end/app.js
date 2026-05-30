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
    message: { error: 'Too many requests — please try again later.' },
});

/* ── Auth endpoint ─────────────────────────────────────────────────
   Credentials are stored in .env and checked server-side.
   Admin password should be bcrypt-hashed before production use.   */
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }
    const adminEmail    = (process.env.ADMIN_EMAIL    || '').toLowerCase();
    const adminPassword =  process.env.ADMIN_PASSWORD || '';
    if (email.trim().toLowerCase() === adminEmail && password === adminPassword) {
        return res.json({ success: true, role: 'admin', email: adminEmail });
    }
    return res.status(401).json({ error: 'Incorrect email or password.' });
});

/* ── AI Recommendation proxy ───────────────────────────────────────
   The OpenRouter API key stays server-side and is never sent to
   the browser. The SSE stream is forwarded directly to the client.  */
app.post('/api/recommend', async (req, res) => {
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
        const list = books
            .map(b => `"${b.title}" by ${b.author} (${b.genre})`)
            .join(', ');
        systemPrompt += ` Our full catalogue (only recommend from this list): ${list}.`;
    }

    try {
        const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': req.headers.referer || req.headers.origin || 'http://localhost:3000',
                'X-Title': 'Maktaba',
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-120b',
                stream: true,
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

        /* Forward the SSE stream straight through to the browser */
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
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        }
    }
});

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
        console.log('✅ MongoDB connected');
    } catch (err) {
        console.log('❌ MongoDB connection error:', err.message);
        setTimeout(connectDB, 5000);
    }
};

connectDB();

mongoose.connection.on('disconnected', () => {
    console.log('❌ MongoDB disconnected — reconnecting...');
    setTimeout(connectDB, 5000);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
