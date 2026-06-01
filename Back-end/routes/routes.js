const express = require('express');
const router  = express.Router();

const bookRoutes      = require('./books');
const authorRoutes    = require('./Authors');
const cartRoutes      = require('./cart');
const orderRoutes     = require('./Order');
const authRoutes      = require('./Authroutes');
const dashboardRoutes = require('./dashboard');

router.use('/books',         bookRoutes);
router.use('/api/authors',   authorRoutes);
router.use('/api/cart',      cartRoutes);
router.use('/api/orders',    orderRoutes);
router.use('/api/auth',      authRoutes);       
router.use('/api/dashboard', dashboardRoutes);

module.exports = router;