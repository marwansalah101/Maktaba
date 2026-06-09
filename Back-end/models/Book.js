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
      required: true
    },

    image: {
      type: String,
      required: true
    },

    pages: {
      type: Number,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    quote: {
      type: String,
      default: ""
    },

    price: {
      type: Number,
      required: true
    },

    language: {
      type: String,
      default: "English"
    },

    ISBN: {
      type: String,
      required: true,
      unique: true
    },
    
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },

    reviewCount: {
      type: Number,
      default: 0,
      min: 0
    },
    salePercent: {
      type: Number,
      default: 0
    },
    salePrice: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true, collection: 'Book' }
);

module.exports = mongoose.model("Book", bookSchema);
