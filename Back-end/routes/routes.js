const express = require("express");
const router  = express.Router();

const bookRoutes   = require("./books");
const authorRoutes = require('./Authors');
const cartRoutes   = require('./cart');
const orderRoutes  = require('./Order');

router.use("/books",      bookRoutes);
router.use("/api/authors", authorRoutes);
router.use("/api/cart",    cartRoutes);
router.use("/api/orders",  orderRoutes);      

module.exports = router;