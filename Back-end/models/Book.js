const mongoose = require("mongoose");

function toSlug(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300
    },

    slug: {
      type: String,
      index: true
    },

    author: {
      type: String,
      required: true,
      maxlength: 200
    },

    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Author'
    },

    genre: {
      type: String,
      required: true,
      maxlength: 100
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
      required: true,
      maxlength: 5000
    },

    quote: {
      type: String,
      default: "",
      maxlength: 1000
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
    }
  },
  { timestamps: true, collection: 'Book' }
);

// Index title for fast title lookups / search (note §5.3).
bookSchema.index({ title: 1 });

// Keep slug in sync with title on create/save (note §2.3).
bookSchema.pre('save', function (next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = toSlug(this.title);
  }
  next();
});

module.exports = mongoose.model("Book", bookSchema);
