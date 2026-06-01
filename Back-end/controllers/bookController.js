const Book = require('../models/Book');
const { stripHtml } = require('../utils/sanitize');

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toSlug(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Strip HTML from the free-text fields of a book payload (guards against stored XSS).
const SANITIZE_FIELDS = ['title', 'author', 'genre', 'description', 'quote', 'language', 'ISBN'];
function sanitizeBookFields(obj) {
    for (const f of SANITIZE_FIELDS) {
        if (typeof obj[f] === 'string') obj[f] = stripHtml(obj[f]);
    }
    return obj;
}

// Opt-in pagination: returns { skip, limit } only when ?page/?limit are present,
// otherwise null so the caller returns the full array (backward compatible).
function getPagination(query) {
    if (query.page === undefined && query.limit === undefined) return null;
    const page  = Math.max(1, parseInt(query.page, 10)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    return { skip: (page - 1) * limit, limit };
}

exports.getGenres = async (req, res, next) => {
    try {
        const result = await Book.aggregate([
            { $group: { _id: '$genre', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $project: { _id: 0, name: '$_id', count: 1 } },
        ]);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.getAllBooks = async (req, res, next) => {
    try {
        const filter = {};
        if (req.query.genre) {
            filter.genre = { $regex: new RegExp(`^${escapeRegex(req.query.genre)}$`, 'i') };
        }
        if (req.query.author) {
            filter.author = { $regex: new RegExp(`^${escapeRegex(req.query.author)}$`, 'i') };
        }
        // Optional free-text search over title/author/genre.
        if (req.query.search) {
            const rx = new RegExp(escapeRegex(req.query.search), 'i');
            filter.$or = [{ title: rx }, { author: rx }, { genre: rx }];
        }

        const pg = getPagination(req.query);
        if (!pg) {
            // No pagination params → full array (unchanged behavior, FE-safe).
            return res.json(await Book.find(filter));
        }
        res.json(await Book.find(filter).skip(pg.skip).limit(pg.limit));
    } catch (err) {
        next(err);
    }
};

exports.getBookByTitle = async (req, res, next) => {
    try {
        const title = decodeURIComponent(req.params.title);
        const book = await Book.findOne({
            title: { $regex: new RegExp(`^${escapeRegex(title)}$`, 'i') },
        });
        if (!book) return res.status(404).json({ error: 'Book not found' });
        res.json(book);
    } catch (err) {
        next(err);
    }
};

exports.getBooksByAuthor = async (req, res, next) => {
    try {
        const filter = {};
        if (req.query.author) filter.author = req.query.author;
        res.json(await Book.find(filter));
    } catch (err) {
        next(err);
    }
};

exports.getBookBySlug = async (req, res, next) => {
    try {
        // Direct indexed lookup on the persisted slug field.
        let book = await Book.findOne({ slug: req.params.slug });

        // Legacy fallback: documents created before the slug field existed.
        // Find by computed slug once, then persist it so future lookups are indexed.
        if (!book) {
            const legacy = await Book.find({ slug: { $in: [null, ''] } }).select('title slug');
            const match = legacy.find(b => toSlug(b.title) === req.params.slug);
            if (match) {
                match.slug = req.params.slug;
                await match.save();
                book = await Book.findById(match._id);
            }
        }

        if (!book) return res.status(404).json({ error: 'Book not found' });
        res.json(book);
    } catch (err) {
        next(err);
    }
};

exports.createBook = async (req, res, next) => {
    try {
        const required = ['title', 'author', 'genre', 'year', 'image', 'pages', 'description', 'price', 'ISBN'];
        const missing = required.filter(f => req.body[f] === undefined || req.body[f] === null || req.body[f] === '');
        if (missing.length) {
            return res.status(422).json({ error: `Missing required fields: ${missing.join(', ')}` });
        }

        const { title, author, genre, year, image, pages, description, quote, price, language, ISBN, stock } = req.body;
        const payload = sanitizeBookFields({ title, author, genre, year, image, pages, description, quote, price, language, ISBN, stock });
        const saved = await new Book(payload).save();
        res.status(201).json(saved);
    } catch (err) {
        next(err);
    }
};

// Build a sanitized update object from a book payload (shared by title/_id update).
function buildBookUpdate(body) {
    const { title, author, genre, year, image, pages, description, quote, price, language, ISBN, stock } = body;
    const update = { title, author, genre, year, image, pages, description, quote, price, language, ISBN, stock };
    Object.keys(update).forEach(k => update[k] === undefined && delete update[k]);
    sanitizeBookFields(update);
    // Keep slug in sync when the title changes (pre-save hooks don't run on findOneAndUpdate).
    if (update.title !== undefined) update.slug = toSlug(update.title);
    return update;
}

exports.updateBook = async (req, res, next) => {
    try {
        const title = decodeURIComponent(req.params.title);
        const update = buildBookUpdate(req.body);

        const updated = await Book.findOneAndUpdate(
            { title: { $regex: new RegExp(`^${escapeRegex(title)}$`, 'i') } },
            update,
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ message: 'Book not found' });
        res.json(updated);
    } catch (err) {
        next(err);
    }
};

exports.deleteBook = async (req, res, next) => {
    try {
        const title = decodeURIComponent(req.params.title);
        const deleted = await Book.findOneAndDelete({
            title: { $regex: new RegExp(`^${escapeRegex(title)}$`, 'i') },
        });
        if (!deleted) return res.status(404).json({ message: 'Book not found' });
        res.json({ message: 'Book deleted successfully' });
    } catch (err) {
        next(err);
    }
};

// ── REST-standard variants keyed by _id (preferred over title-based routes) ──
exports.updateBookById = async (req, res, next) => {
    try {
        const updated = await Book.findByIdAndUpdate(
            req.params.id,
            buildBookUpdate(req.body),
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ message: 'Book not found' });
        res.json(updated);
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid book ID format.' });
        next(err);
    }
};

exports.deleteBookById = async (req, res, next) => {
    try {
        const deleted = await Book.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Book not found' });
        res.json({ message: 'Book deleted successfully' });
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid book ID format.' });
        next(err);
    }
};
