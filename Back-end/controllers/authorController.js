const Author = require('../models/Author');

exports.getAllAuthors = async (req, res, next) => {
    try {
        res.json(await Author.find());
    } catch (err) {
        next(err);
    }
};

exports.getAuthorBySlug = async (req, res, next) => {
    try {
        const author = await Author.findOne({ slug: req.params.slug }).populate('books');
        if (!author) return res.status(404).json({ message: 'Author not found' });
        res.json(author);
    } catch (err) {
        next(err);
    }
};

exports.getBooksByAuthorSlug = async (req, res, next) => {
    try {
        const author = await Author.findOne({ slug: req.params.slug }).populate('books');
        if (!author) return res.status(404).json({ message: 'Author not found' });
        res.json(author.books);
    } catch (err) {
        next(err);
    }
};

exports.getAuthorById = async (req, res, next) => {
    try {
        const author = await Author.findById(req.params.id).populate('books');
        if (!author) return res.status(404).json({ message: 'Author not found' });
        res.json(author);
    } catch (err) {
        next(err);
    }
};

exports.createAuthor = async (req, res, next) => {
    try {
        const required = ['name', 'slug'];
        const missing = required.filter(f => !req.body[f]);
        if (missing.length) {
            return res.status(422).json({ error: `Missing required fields: ${missing.join(', ')}` });
        }

        const { name, slug, stats, aboutTitle, aboutText, bannerImg, books } = req.body;
        let profileImg = req.body.profileImg;
        if (req.file) {
            profileImg = `/uploads/authors/${req.file.filename}`;
        }

        let parsedBooks = books;
        if (typeof books === 'string') {
            try {
                parsedBooks = JSON.parse(books);
            } catch (e) {
                // leave as-is if not JSON
            }
        }

        const saved = await new Author({
            name,
            slug,
            stats,
            aboutTitle,
            aboutText,
            bannerImg,
            profileImg,
            books: parsedBooks,
        }).save();
        res.status(201).json(saved);
    } catch (err) {
        next(err);
    }
};

exports.updateAuthor = async (req, res, next) => {
    try {
        const { name, slug, stats, aboutTitle, aboutText, bannerImg, profileImg, books } = req.body;
        const update = { name, slug, stats, aboutTitle, aboutText, bannerImg, profileImg, books };
        Object.keys(update).forEach(k => update[k] === undefined && delete update[k]);

        const updated = await Author.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!updated) return res.status(404).json({ message: 'Author not found' });
        res.json(updated);
    } catch (err) {
        next(err);
    }
};

exports.deleteAuthor = async (req, res, next) => {
    try {
        const deleted = await Author.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Author not found' });
        res.json({ message: 'Author deleted successfully', author: deleted });
    } catch (err) {
        next(err);
    }
};
