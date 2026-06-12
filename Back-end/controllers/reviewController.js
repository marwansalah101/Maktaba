const Review = require('../models/Review');
const Book   = require('../models/Book');

exports.addReview = async (req, res, next) => {
    try {
        const { bookId } = req.params;

        // Books use string _id values in this database — bypass Mongoose ObjectId casting
        const book = await Book.collection.findOne({ _id: bookId });
        if (!book) return res.status(404).json({ error: 'Book not found.' });

        const rating = Number(req.body.rating);
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(422).json({ error: 'rating must be an integer between 1 and 5.' });
        }

        const { comment } = req.body;
        const reviewer = req.user._id;
        await Review.create({ bookId, rating, reviewer, comment });

        // Recompute average — match by raw string bookId
        const agg = await Review.aggregate([
            { $match: { bookId: bookId } },
            { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
        ]);

        const { avg = 0, count = 0 } = agg[0] || {};
        const averageRating = Math.round(avg * 10) / 10;

        await Book.collection.updateOne(
            { _id: bookId },
            { $set: { averageRating, reviewCount: count } }
        );

        res.status(201).json({ averageRating, reviewCount: count });
    } catch (err) {
        next(err);
    }
};

exports.getReviews = async (req, res, next) => {
    try {
        const { bookId } = req.params;

        const reviews = await Review.find({ bookId }).populate('reviewer', 'name').sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        next(err);
    }
};
