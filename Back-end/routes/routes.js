const express = require("express");
const router  = express.Router();

const bookRoutes   = require("./books");
const authorRoutes = require("./Authors");
const cartRoutes   = require("./cart");
const orderRoutes  = require("./orders");
const authRoutes   = require("./Authroutes"); // ✅ added

router.use("/books",       bookRoutes);
router.use("/api/authors", authorRoutes);
router.use("/api/cart",    cartRoutes);
router.use("/api/orders",  orderRoutes);      
router.use("/cart",        cartRoutes);
router.use("/orders",      orderRoutes);
router.use("/api/auth",    authRoutes); // ✅ added

module.exports = router;