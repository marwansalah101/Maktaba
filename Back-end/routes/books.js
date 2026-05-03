const express = require("express");
const router = express.Router();
const Book = require("../models/Book");

// GET all books
router.get("/", async (req, res) => {
    try {
        const books = await Book.find();
        res.json(books);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
//get book by title
router.get("/title/:title", async (req, res) => {
    try {
            console.log("HIT title route:", req.params.title); // ← add this

        const title = decodeURIComponent(req.params.title); // decode %20 spaces etc.
        const book = await Book.findOne({ 
            title: { $regex: new RegExp(`^${title}$`, "i") } // case-insensitive match
        });
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