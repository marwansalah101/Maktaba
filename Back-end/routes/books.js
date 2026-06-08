const express  = require('express');
const router   = express.Router();
const books    = require('../controllers/bookController');
const reviews  = require('../controllers/reviewController');

router.get('/genres',              books.getGenres);
router.get('/',                    books.getAllBooks);
router.get('/title/:title',        books.getBookByTitle);
router.get('/author',              books.getBooksByAuthor);
router.get('/slug/:slug',          books.getBookBySlug);
router.post('/',                   books.createBook);
router.put('/title/:title',        books.updateBook);
router.delete('/title/:title',     books.deleteBook);
router.put('/id/:id',              books.updateBookById);
router.delete('/id/:id',           books.deleteBookById);

router.get('/:bookId/reviews',     reviews.getReviews);
router.post('/:bookId/reviews',    reviews.addReview);

module.exports = router;
