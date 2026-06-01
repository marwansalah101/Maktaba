const mongoose = require('mongoose');
const Review   = require('../models/Review');
const Book     = require('../models/Book');
const { stripHtml } = require('../utils/sanitize');

// Recompute a book's averageRating + reviewCount from all its reviews.
// Shared by addReview and deleteReview to avoid denormalization drift (note §5.5).
async function recalcBookRating(bookId) {
    const agg = await Review.aggregate([
        { $match: { bookId: new mongoose.Types.ObjectId(bookId) } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const { avg = 0, count = 0 } = agg[0] || {};
    return Book.findByIdAndUpdate(
        bookId,
        { averageRating: Math.round(avg * 10) / 10, reviewCount: count },
        { new: true }
    );
}

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

        // Reviewer identity comes from the authenticated user, never the client
        // body (prevents impersonation / spam). Comment is HTML-stripped.
        const reviewer = req.user?.name || 'Anonymous';
        const comment  = stripHtml(req.body.comment);
        await Review.create({ bookId, rating, reviewer, comment });

        const updated = await recalcBookRating(bookId);

        res.status(201).json({
            averageRating: updated.averageRating,
            reviewCount:   updated.reviewCount,
        });
    } catch (err) {
        next(err);
    }
};

// @desc   Delete a review (moderation) and recalc the book's rating
// @route  DELETE /books/:bookId/reviews/:id   [admin only]
exports.deleteReview = async (req, res, next) => {
    try {
        const { bookId, id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(bookId) || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid ID.' });
        }
        const deleted = await Review.findOneAndDelete({ _id: id, bookId });
        if (!deleted) return res.status(404).json({ error: 'Review not found.' });

        const updated = await recalcBookRating(bookId);
        res.json({
            success: true,
            averageRating: updated?.averageRating ?? 0,
            reviewCount:   updated?.reviewCount ?? 0,
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

        const reviews = await Review.find({ bookId }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        next(err);
    }
};
