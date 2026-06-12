const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        bookId: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
            index: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        reviewer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        comment: {
            type: String,
            default: '',
            trim: true,
            maxlength: 2000,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
