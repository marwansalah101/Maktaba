const express = require("express");
const router  = express.Router();

const bookRoutes   = require("./books");
<<<<<<< Updated upstream
=======
<<<<<<< HEAD
const authorRoutes = require('./Authors');
const cartRoutes   = require('./cart');
<<<<<<< Updated upstream
const orderRoutes  = require('./Order');
=======
const authRoutes   = require('./Authroutes');
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
const authorRoutes = require("./Authors");
const cartRoutes   = require("./cart");
const orderRoutes  = require("./orders");
const authRoutes   = require("./Authroutes"); // ✅ added
<<<<<<< Updated upstream
=======
>>>>>>> 03b453fae4d46ff506a4c3f97725caef3369cec4
>>>>>>> Stashed changes

router.use("/books",       bookRoutes);
router.use("/api/authors", authorRoutes);
router.use("/api/cart",    cartRoutes);
<<<<<<< Updated upstream
router.use("/api/orders",  orderRoutes);      
<<<<<<< Updated upstream
router.use("/cart",        cartRoutes);
router.use("/orders",      orderRoutes);
router.use("/api/auth",    authRoutes); // ✅ added
=======
<<<<<<< HEAD
=======
router.use("/api/auth",    authRoutes);
>>>>>>> Stashed changes
=======
router.use("/cart",        cartRoutes);
router.use("/orders",      orderRoutes);
router.use("/api/auth",    authRoutes); // ✅ added
>>>>>>> 03b453fae4d46ff506a4c3f97725caef3369cec4
>>>>>>> Stashed changes

module.exports = router;