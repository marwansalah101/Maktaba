const express = require("express");
const router  = express.Router();

const bookRoutes   = require("./books");
const authorRoutes = require('./Authors');
const cartRoutes   = require('./cart');  

router.use("/books",      bookRoutes);
router.use("/api/authors", authorRoutes);
router.use("/api/cart",    cartRoutes);       

module.exports = router;