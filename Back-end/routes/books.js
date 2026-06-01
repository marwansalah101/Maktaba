const express  = require('express');
const router   = express.Router();
const books    = require('../controllers/bookController');
const reviews  = require('../controllers/reviewController');
const { protect, adminOnly } = require('../middlewares/auth');

// ── Public reads ────────────────────────────────────────────────────────────
router.get('/genres',              books.getGenres);
router.get('/',                    books.getAllBooks);
router.get('/title/:title',        books.getBookByTitle);
router.get('/author',              books.getBooksByAuthor);
router.get('/slug/:slug',          books.getBookBySlug);

// ── Admin-only writes ─────────────────────────────────────────────────────────
router.post('/',                   protect, adminOnly, books.createBook);
router.put('/title/:title',        protect, adminOnly, books.updateBook);
router.delete('/title/:title',     protect, adminOnly, books.deleteBook);
// REST-standard variants keyed by _id (preferred).
router.put('/:id',                 protect, adminOnly, books.updateBookById);
router.delete('/:id',              protect, adminOnly, books.deleteBookById);

// ── Reviews ───────────────────────────────────────────────────────────────────
router.get('/:bookId/reviews',         reviews.getReviews);
router.post('/:bookId/reviews',        protect, reviews.addReview);
router.delete('/:bookId/reviews/:id',  protect, adminOnly, reviews.deleteReview);

module.exports = router;
