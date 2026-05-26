const express = require('express');
const router = express.Router();
const Author = require('../models/Author');

// GET all authors
router.get("/", async (req, res) => {
    try {
        const authors = await Author.find();
        res.json(authors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET author by slug
router.get('/slug/:slug', async (req, res) => {
    try {
        const author = await Author.findOne({ slug: req.params.slug }).populate('books');
        if (!author) return res.status(404).json({ message: 'Author not found' });
        res.json(author);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET books by author slug
router.get('/slug/:slug/books', async (req, res) => {
    try {
        const author = await Author.findOne({ slug: req.params.slug }).populate('books');
        if (!author) return res.status(404).json({ message: 'Author not found' });
        res.json(author.books);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET author by ID
router.get("/:id", async (req, res) => {
    try {
        const author = await Author.findById(req.params.id).populate('books');
        if (!author) return res.status(404).json({ message: "Author not found" });
        res.json(author);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST — create a new author
router.post("/", async (req, res) => {
    try {
        // Destructure known fields — never pass raw req.body to the model constructor
        const { name, slug, stats, aboutTitle, aboutText, bannerImg, profileImg, books } = req.body;
        const newAuthor = new Author({ name, slug, stats, aboutTitle, aboutText, bannerImg, profileImg, books });
        const savedAuthor = await newAuthor.save();
        res.status(201).json(savedAuthor);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT — update an author by ID
router.put('/:id', async (req, res) => {
    try {
        // Destructure and strip undefined so partial updates work correctly
        const { name, slug, stats, aboutTitle, aboutText, bannerImg, profileImg, books } = req.body;
        const update = { name, slug, stats, aboutTitle, aboutText, bannerImg, profileImg, books };
        Object.keys(update).forEach(k => update[k] === undefined && delete update[k]);

        const updatedAuthor = await Author.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true }
        );
        if (!updatedAuthor) return res.status(404).json({ message: 'Author not found' });
        res.json(updatedAuthor);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE — remove an author by ID
router.delete("/:id", async (req, res) => {
    try {
        const deletedAuthor = await Author.findByIdAndDelete(req.params.id);
        if (!deletedAuthor) {
            return res.status(404).json({ message: "Author not found" }); // return prevents double-response
        }
        res.json({ message: "Author deleted successfully", author: deletedAuthor });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
