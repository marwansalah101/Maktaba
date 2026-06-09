const express  = require('express');
const router   = express.Router();
const books    = require('../controllers/bookController');
const reviews  = require('../controllers/reviewController');
const { protect, adminOnly } = require('../middlewares/auth');
const { bookRules, reviewRules, validate } = require('../middlewares/validators');

router.get('/genres',              books.getGenres);
router.get('/',                    books.getAllBooks);
router.get('/title/:title',        books.getBookByTitle);
router.get('/author',              books.getBooksByAuthor);
router.get('/slug/:slug',          books.getBookBySlug);
router.post('/',                   protect, adminOnly, bookRules,   validate, books.createBook);
router.put('/title/:title',        protect, adminOnly, books.updateBook);
router.delete('/title/:title',     protect, adminOnly, books.deleteBook);
router.put('/id/:id',              protect, adminOnly, books.updateBookById);
router.delete('/id/:id',           protect, adminOnly, books.deleteBookById);

router.get('/:bookId/reviews',     reviews.getReviews);
router.post('/:bookId/reviews',    reviewRules, validate, reviews.addReview);

module.exports = router;
