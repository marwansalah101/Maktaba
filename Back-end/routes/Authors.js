const express = require('express');
const router = express.Router();
const Author = require('../models/Author');

// 1. GET all authors (To show on your Authors list page)
router.get("/", async (req, res) => {
    try {
        const authors = await Author.find();
        res.json(authors);// This sends the data to your frontend
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. GET a specific author by ID (For the "Author Details" page)
// Uses req.params
router.get("/:id", async (req, res) => {
    try {
        const author = await Author.findById(req.params.id).populate('books');
        if (!author) return res.status(404).json({ message: "Author not found" });
        res.json(author);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. POST a new author (For your admin panel/adding data)
// Uses req.body
router.post("/", async (req, res) => {
   try {
    const newAuthor = new Author(req.body); // Takes data from frontend form
        const savedAuthor = await newAuthor.save();
        res.status(201).json(savedAuthor);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


// DELETE an author by ID
router.delete("/:id", async (req, res) => {
    try {
        // Find the author by the ID in the URL and remove them
        const deletedAuthor = await Author.findByIdAndDelete(req.params.id);

        // If no author was found with that ID
        if (!deletedAuthor) {
            return res.status(404).json({ message: "Author not found" });
        }

        // Send back the deleted author data or a success message
        res.json({ message: "Author deleted successfully", author: deletedAuthor });
    } catch (err) {
        // Handle potential errors (like a malformed ID)
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;