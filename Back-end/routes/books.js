const express = require("express");
const router = express.Router();
const Book = require("../models/Books");

// GET all books
router.get("/", async (req, res) => {
    try {
        const books = await Book.find();
        res.json(books);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
//get book by id
router.get("/:id", async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ error: "Book not found" });
        res.json(book);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Create a new book
router.post("/", async (req, res) => {
    try {
        const newBook = new Book(req.body);
        const savedBook = await newBook.save();
        res.status(201).json(savedBook);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }


});
//Update a  book
router.put("/:id", async (req, res) => {
    try {
        const updatedBook = await Book.findByIdAndUpdate(req.params.id,
            req.body, { new: true });
        if (!updatedBook) {
            return res.status(404).json({ message: "Book not found" });
        }
        res.json(updatedBook);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
//Delete a book
router.delete("/:id",async (req,res) => {

try {
 const deletedBook = await Book.findByIdAndDelete(req.params.id);
if(!deletedBook){
res.status(404).json( {message: "Book not found" });
}

res.json({ message: "Book deleted successfully"});
}
catch(err){
res.status(500).json({ error: err.message });
}
});

module.exports = router;