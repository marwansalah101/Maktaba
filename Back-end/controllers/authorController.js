const Author = require('../models/Author');
const Book = require('../models/Book');

exports.getAllAuthors = async (req, res, next) => {
    try {
        const authors = await Author.find();
        const counts = await Book.aggregate([
            { $group: { _id: '$author', count: { $sum: 1 } } }
        ]);
        const countMap = new Map(counts.map(item => [item._id, item.count]));

        const authorsWithCounts = authors.map(author => {
            const authorObj = author.toObject();
            const countByName = countMap.get(author.name) || 0;
            const bookCount = Array.isArray(authorObj.books) && authorObj.books.length > 0
                ? authorObj.books.length
                : countByName;
            return { ...authorObj, bookCount };
        });

        res.json(authorsWithCounts);
    } catch (err) {
        next(err);
    }
};

function nameToSlug(s) {
    return String(s || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

exports.getAuthorBySlug = async (req, res, next) => {
    try {
        let author = await Author.findOne({ slug: req.params.slug }).populate('books');

        if (!author) {
            // Fallback 1: match any author whose normalized name equals the incoming slug.
            // Fixes mismatches like "j-k-rowling" vs stored "jk-rowling" and
            // "gabriel-garcia-marquez" vs stored slug with different accent handling.
            const all = await Author.find({}, 'name slug');
            const hit = all.find(a => nameToSlug(a.name) === req.params.slug);
            if (hit) {
                author = await Author.findById(hit._id).populate('books');
            }
        }

        if (!author) {
            // Fallback 2: no Author document at all — build a minimal response from the
            // Book collection using the same slug function so the page still shows books.
            const allBooks = await Book.find({});
            const authorBooks = allBooks.filter(b => nameToSlug(b.author) === req.params.slug);
            if (authorBooks.length > 0) {
                const authorName = authorBooks[0].author;
                return res.json({
                    name: authorName,
                    slug: req.params.slug,
                    stats: '',
                    aboutTitle: `About ${authorName}`,
                    aboutText: 'No biography available.',
                    bannerImg: '',
                    profileImg: '',
                    books: authorBooks,
                    _synthetic: true,
                });
            }
            return res.status(404).json({ message: 'Author not found' });
        }

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
