const express = require("express");
const router = express.Router();

const bookRoutes   = require("./books");
const authorRoutes = require('./Authors');

router.use("/books",        bookRoutes);
router.use("/api/authors",  authorRoutes); // consolidated here — removes the duplicate mount in app.js

module.exports = router;
