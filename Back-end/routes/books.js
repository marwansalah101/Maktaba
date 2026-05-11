const express = require("express");
const router = express.Router();
const Book = require("../models/Book");// means go up one folder 

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
            filter.genre = { $regex: new RegExp(`^${req.query.genre}$`, 'i') };
        }
        const books = await Book.find(filter);
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
        console.log("Book created:", newbook); // ← add this

    } catch (err) {
        res.status(500).json({ error: err.message });
    }


});
//Update a  book
router.put("/title/:title", async (req, res) => {
    try {
        const updatedBook = await Book.findOneAndUpdate(
            { title: { $regex: new RegExp(`^${decodeURIComponent(req.params.title)}$`, "i") } },
            req.body,
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
//Delete a book
router.delete("/title/:title",async (req,res) => {

try {
 const deletedBook = await Book.findOneAndDelete(
            { title: { $regex: new RegExp(`^${decodeURIComponent(req.params.title)}$`, "i") } }
        );
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




