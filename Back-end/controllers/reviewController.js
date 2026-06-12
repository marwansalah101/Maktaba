const mongoose = require('mongoose');
const Review   = require('../models/Review');
const Book     = require('../models/Book');

exports.addReview = async (req, res, next) => {
    try {
        const { bookId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({ error: 'Invalid book ID.' });
        }

        const book = await Book.findById(bookId);
        if (!book) return res.status(404).json({ error: 'Book not found.' });

        const rating = Number(req.body.rating);
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(422).json({ error: 'rating must be an integer between 1 and 5.' });
        }

        const { comment } = req.body;
        const reviewer = req.user._id;
        await Review.create({ bookId, rating, reviewer, comment });

        /* Recompute average from all reviews — avoids floating-point drift */
        const agg = await Review.aggregate([
            { $match: { bookId: new mongoose.Types.ObjectId(bookId) } },
            { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
        ]);

        const { avg = 0, count = 0 } = agg[0] || {};
        const averageRating = Math.round(avg * 10) / 10;

        const updated = await Book.findByIdAndUpdate(
            bookId,
            { averageRating, reviewCount: count },
            { new: true }
        );

        res.status(201).json({
            averageRating: updated.averageRating,
            reviewCount:   updated.reviewCount,
        });
    } catch (err) {
        next(err);
    }
};

exports.getReviews = async (req, res, next) => {
    try {
        const { bookId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({ error: 'Invalid book ID.' });
        }

        const reviews = await Review.find({ bookId }).populate('reviewer', 'name').sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        next(err);
    }
};
