const Book = require('../models/Book');

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toSlug(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
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
        res.json(await Book.find(filter));
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
        const books = await Book.find({});
        const book = books.find(b => toSlug(b.title) === req.params.slug);
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
        const saved = await new Book({ title, author, genre, year, image, pages, description, quote, price, language, ISBN, stock }).save();
        res.status(201).json(saved);
    } catch (err) {
        next(err);
    }
};

exports.updateBook = async (req, res, next) => {
    try {
        const title = decodeURIComponent(req.params.title);
        const { title: newTitle, author, genre, year, image, pages, description, quote, price, language, ISBN, stock } = req.body;
        const update = { title: newTitle, author, genre, year, image, pages, description, quote, price, language, ISBN, stock };
        Object.keys(update).forEach(k => update[k] === undefined && delete update[k]);

        const updated = await Book.findOneAndUpdate(
            { title: { $regex: new RegExp(`^${escapeRegex(title)}$`, 'i') } },
            update,
            { new: true }
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
