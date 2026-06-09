const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    author: {
      type: String,
      required: true
    },

    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Author'
    },

    genre: {
      type: String,
      required: true
    },

    year: {
      type: Number,
      required: [true, 'Year is required.'],
      min: [1000, 'Year must be a valid number.'],
      max: [new Date().getFullYear() + 1, 'Year cannot be in the future.'],
    },

    image: {
      type: String,
      required: [true, 'Image URL is required.'],
    },

    pages: {
      type: Number,
      required: [true, 'Pages is required.'],
      min: [1, 'Pages must be at least 1.'],
    },

    description: {
      type: String,
      required: [true, 'Description is required.'],
    },

    quote: {
      type: String,
      default: ""
    },

    price: {
      type: Number,
      required: [true, 'Price is required.'],
      min: [0, 'Price must be a non-negative number.'],
    },

    language: {
      type: String,
      default: "English"
    },

    ISBN: {
      type: String,
      required: [true, 'ISBN is required.'],
      unique: true,
    },

    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock must be non-negative.'],
    },

    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative.'],
      max: [5, 'Rating cannot exceed 5.'],
    },

    reviewCount: {
      type: Number,
      default: 0,
      min: [0, 'Review count cannot be negative.'],
    },
    salePercent: {
      type: Number,
      default: 0,
      min: [0, 'Sale percent must be non-negative.'],
      max: [100, 'Sale percent cannot exceed 100.'],
    },
    salePrice: {
      type: Number,
      default: 0,
      min: [0, 'Sale price must be non-negative.'],
    }
  },
  { timestamps: true, collection: 'Book' }
);

module.exports = mongoose.model("Book", bookSchema);
