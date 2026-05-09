const mongoose = require("mongoose");

const authorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
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