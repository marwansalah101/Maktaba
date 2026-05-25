const express = require("express");
const router = express.Router();
const Book = require("../models/Book");

/* Escapes regex special characters so user input is treated as a literal string.
   Prevents ReDoS attacks via catastrophic backtracking. */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET genres with book counts, sorted by count desc
router.get("/genres", async (req, res) => {
    try {
        const result = await Book.aggregate([
            { $group: { _id: "$genre", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $project: { _id: 0, name: "$_id", count: 1 } }
        ]);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET all books — optional ?genre=Fantasy query filter
router.get("/", async (req, res) => {
    try {
        const filter = {};
        if (req.query.genre) {
            const escaped = escapeRegex(req.query.genre);
            filter.genre = { $regex: new RegExp(`^${escaped}$`, 'i') };
        }
        const books = await Book.find(filter);
        res.json(books);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET book by title
router.get("/title/:title", async (req, res) => {
    try {
        const title = decodeURIComponent(req.params.title);
        const escaped = escapeRegex(title);
        const book = await Book.findOne({
            title: { $regex: new RegExp(`^${escaped}$`, "i") }
        });
        if (!book) return res.status(404).json({ error: "Book not found" });
        res.json(book);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST — create a new book
router.post("/", async (req, res) => {
    try {
        // Destructure known fields — never pass raw req.body to the model constructor
        const { title, author, genre, year, image, pages, description, quote, price, language, ISBN, stock } = req.body;
        const newBook = new Book({ title, author, genre, year, image, pages, description, quote, price, language, ISBN, stock });
        const savedBook = await newBook.save();
        res.status(201).json(savedBook);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT — update a book by title
router.put("/title/:title", async (req, res) => {
    try {
        const title = decodeURIComponent(req.params.title);
        const escaped = escapeRegex(title);
        // Destructure and strip undefined so partial updates work correctly
        const { title: newTitle, author, genre, year, image, pages, description, quote, price, language, ISBN, stock } = req.body;
        const update = { title: newTitle, author, genre, year, image, pages, description, quote, price, language, ISBN, stock };
        Object.keys(update).forEach(k => update[k] === undefined && delete update[k]);

        const updatedBook = await Book.findOneAndUpdate(
            { title: { $regex: new RegExp(`^${escaped}$`, "i") } },
            update,
            { new: true }
        );
        if (!updatedBook) {
            return res.status(404).json({ message: "Book not found" });
        }
        res.json(updatedBook);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE — remove a book by title
router.delete("/title/:title", async (req, res) => {
    try {
        const title = decodeURIComponent(req.params.title);
        const escaped = escapeRegex(title);
        const deletedBook = await Book.findOneAndDelete(
            { title: { $regex: new RegExp(`^${escaped}$`, "i") } }
        );
        if (!deletedBook) {
            return res.status(404).json({ message: "Book not found" }); // return prevents double-response
        }
        res.json({ message: "Book deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
