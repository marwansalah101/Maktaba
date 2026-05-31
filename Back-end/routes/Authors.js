const express = require('express');
const router  = express.Router();
const authors = require('../controllers/authorController');

router.get('/',                   authors.getAllAuthors);
router.get('/slug/:slug',         authors.getAuthorBySlug);
router.get('/slug/:slug/books',   authors.getBooksByAuthorSlug);
router.get('/:id',                authors.getAuthorById);
router.post('/',                  authors.createAuthor);
router.put('/:id',                authors.updateAuthor);
router.delete('/:id',             authors.deleteAuthor);

module.exports = router;
