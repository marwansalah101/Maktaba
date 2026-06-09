const mongoose = require("mongoose");

const authorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Author name is required.'],
      trim: true,
      minlength: [2, 'Author name must be at least 2 characters.'],
      maxlength: [150, 'Author name cannot exceed 150 characters.'],
    },

    slug: {
      type: String,
      required: [true, 'Slug is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens.'],
    },

    stats: {
      type: String,
      default: ""
    },

    aboutTitle: {
      type: String,
      default: ""
    },

    aboutText: {
      type: String,
      default: ""
    },

    bannerImg: {
      type: String,
      default: ""
    },

    profileImg: {
      type: String,
      default: ""
    },

    books: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Author", authorSchema);