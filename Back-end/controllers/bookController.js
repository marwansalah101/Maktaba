const Book = require('../models/Book');

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toSlug(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function parseOptionalNumber(value) {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
}

function normalizeSaleFields(body) {
    const basePrice = parseOptionalNumber(body.price);
    const salePercent = parseOptionalNumber(body.salePercent);
    const salePrice = parseOptionalNumber(body.salePrice);

    if (Number.isNaN(basePrice)) return { error: 'Price must be a valid number.' };
    if (Number.isNaN(salePercent)) return { error: 'Sale percent must be a valid number.' };
    if (Number.isNaN(salePrice)) return { error: 'Sale price must be a valid number.' };

    if (salePercent !== undefined && (salePercent < 0 || salePercent > 100)) {
        return { error: 'Sale percent must be between 0 and 100.' };
    }
    if (salePrice !== undefined && salePrice < 0) {
        return { error: 'Sale price must be a non-negative number.' };
    }

    let nextSalePercent = salePercent ?? 0;
    let nextSalePrice = salePrice ?? 0;

    if (basePrice !== undefined && basePrice > 0) {
        if (nextSalePercent > 0 && salePrice === undefined) {
            nextSalePrice = Number((basePrice * (1 - nextSalePercent / 100)).toFixed(2));
        }

        if (salePrice !== undefined && salePercent === undefined) {
            nextSalePercent = Math.max(0, Math.round(((basePrice - nextSalePrice) / basePrice) * 100));
        }

        if (nextSalePercent > 0 && nextSalePrice > basePrice) {
            return { error: 'Sale price must be less than the original price.' };
        }

        if (salePrice !== undefined && nextSalePrice >= basePrice && nextSalePercent > 0) {
            return { error: 'Sale price must be less than the original price.' };
        }
    }

    return {
        salePercent: nextSalePercent || 0,
        salePrice: nextSalePrice || 0,
    };
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
        const sale = normalizeSaleFields(req.body);
        if (sale.error) return res.status(422).json({ error: sale.error });
        if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
            return res.status(422).json({ error: 'Price must be a non-negative number.' });
        }
        if (stock !== undefined && (isNaN(Number(stock)) || Number(stock) < 0 || !Number.isInteger(Number(stock)))) {
            return res.status(422).json({ error: 'Stock must be a non-negative integer.' });
        }
        const saved = await new Book({
            title,
            author,
            genre,
            year,
            image,
            pages,
            description,
            quote,
            price,
            language,
            ISBN,
            stock,
            salePercent: sale.salePercent,
            salePrice: sale.salePrice,
        }).save();
        res.status(201).json(saved);
    } catch (err) {
        next(err);
    }
};

exports.updateBook = async (req, res, next) => {
    try {
        const title = decodeURIComponent(req.params.title);
        const { title: newTitle, author, genre, year, image, pages, description, quote, price, language, ISBN, stock } = req.body;
        const hasSaleInput = Object.prototype.hasOwnProperty.call(req.body, 'salePercent')
          || Object.prototype.hasOwnProperty.call(req.body, 'salePrice');
        const sale = hasSaleInput ? normalizeSaleFields(req.body) : {};
        if (sale.error) return res.status(422).json({ error: sale.error });
        if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
            return res.status(422).json({ error: 'Price must be a non-negative number.' });
        }
        if (stock !== undefined && (isNaN(Number(stock)) || Number(stock) < 0 || !Number.isInteger(Number(stock)))) {
            return res.status(422).json({ error: 'Stock must be a non-negative integer.' });
        }
        const update = {
            title: newTitle,
            author,
            genre,
            year,
            image,
            pages,
            description,
            quote,
            price,
            language,
            ISBN,
            stock,
        };
        if (hasSaleInput) {
            update.salePercent = sale.salePercent;
            update.salePrice = sale.salePrice;
        }
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

exports.deleteBookById = async (req, res, next) => {
    try {
        const deleted = await Book.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Book not found' });
        res.json({ message: 'Book deleted successfully' });
    } catch (err) {
        next(err);
    }
};

exports.updateBookById = async (req, res, next) => {
    try {
        const { title, author, genre, year, image, pages, description, quote, price, language, ISBN, stock } = req.body;
        const hasSaleInput = Object.prototype.hasOwnProperty.call(req.body, 'salePercent')
          || Object.prototype.hasOwnProperty.call(req.body, 'salePrice');
        const sale = hasSaleInput ? normalizeSaleFields(req.body) : {};
        if (sale.error) return res.status(422).json({ error: sale.error });
        if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
            return res.status(422).json({ error: 'Price must be a non-negative number.' });
        }
        const update = {
            title,
            author,
            genre,
            year,
            image,
            pages,
            description,
            quote,
            price,
            language,
            ISBN,
            stock,
        };
        if (hasSaleInput) {
            update.salePercent = sale.salePercent;
            update.salePrice = sale.salePrice;
        }
        Object.keys(update).forEach(k => update[k] === undefined && delete update[k]);
        const updated = await Book.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!updated) return res.status(404).json({ message: 'Book not found' });
        res.json(updated);
    } catch (err) {
        next(err);
    }
};
