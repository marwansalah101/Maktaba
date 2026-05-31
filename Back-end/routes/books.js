const express = require('express');
const router  = express.Router();
const books   = require('../controllers/bookController');

router.get('/genres',        books.getGenres);
router.get('/',              books.getAllBooks);
router.get('/title/:title',  books.getBookByTitle);
router.get('/author',        books.getBooksByAuthor);
router.get('/slug/:slug',    books.getBookBySlug);
router.post('/',             books.createBook);
router.put('/title/:title',  books.updateBook);
router.delete('/title/:title', books.deleteBook);

module.exports = router;
