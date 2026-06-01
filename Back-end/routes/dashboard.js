const express = require('express');
const router = express.Router();
console.log('[DEBUG] Loading dashboard routes');
const Book = require('../models/Book');
const Author = require('../models/Author');
const Order = require('../models/Order');
const { protect, adminOnly } = require('../middlewares/auth');

router.get('/stats', protect, adminOnly, async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalBooks,
      totalAuthors,
      newBooksThisMonth,
      authorsAddedThisMonth,
      lowStockBooks,
      totalStockResult,
      genreCounts,
    ] = await Promise.all([
      Book.countDocuments(),
      Author.countDocuments(),
      Book.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Author.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Book.find({ stock: { $lte: 10 } })
        .sort({ stock: 1, createdAt: -1 })
        .limit(5)
        .select('title author stock')
        .lean(),
      Book.aggregate([{ $group: { _id: null, total: { $sum: '$stock' } } }]),
      Book.aggregate([
        { $group: { _id: '$genre', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const totalStock = totalStockResult[0] ? totalStockResult[0].total : 0;
    const genreBreakdown = genreCounts.map((item) => ({
      genre: item._id,
      count: item.count,
      pct: totalBooks > 0 ? Math.round((item.count / totalBooks) * 1000) / 10 : 0,
    }));

    res.json({
      stats: {
        totalBooks,
        totalAuthors,
        newBooksThisMonth,
        authorsAddedThisMonth,
        totalStock,
        lowStockBooks,
        genreBreakdown,
      },
    });
  } catch (err) {
    next(err);
  }
});


// Temporary diagnostics endpoint (no auth) — remove after debugging
router.get('/stats-public', async (req, res, next) => {
  console.log('[DEBUG] /stats-public handler invoked');
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalBooks,
      totalAuthors,
      newBooksThisMonth,
      authorsAddedThisMonth,
    ] = await Promise.all([
      Book.countDocuments(),
      Author.countDocuments(),
      Book.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Author.countDocuments({ createdAt: { $gte: startOfMonth } }),
    ]);

    res.json({ totalBooks, totalAuthors, newBooksThisMonth, authorsAddedThisMonth });
  } catch (err) {
    next(err);
  }
});

// Revenue overview endpoint
router.get('/revenue', protect, adminOnly, async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalRevenueResult,
      monthRevenueResult,
      yearRevenueResult,
      totalOrders,
      monthOrders,
      revenueByGenre,
      topSellingBooks,
    ] = await Promise.all([
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.aggregate([
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'books',
            localField: 'items.bookId',
            foreignField: '_id',
            as: 'bookData',
          },
        },
        {
          $group: {
            _id: { $arrayElemAt: ['$bookData.genre', 0] },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            quantity: { $sum: '$items.quantity' },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
      Order.aggregate([
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.bookId',
            title: { $first: '$items.title' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            quantity: { $sum: '$items.quantity' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const totalRevenue = totalRevenueResult[0] ? totalRevenueResult[0].total : 0;
    const monthRevenue = monthRevenueResult[0] ? monthRevenueResult[0].total : 0;
    const yearRevenue = yearRevenueResult[0] ? yearRevenueResult[0].total : 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    res.json({
      revenue: {
        totalRevenue,
        monthRevenue,
        yearRevenue,
        totalOrders,
        monthOrders,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        revenueByGenre: revenueByGenre.map((item) => ({
          genre: item._id,
          revenue: Math.round(item.revenue * 100) / 100,
          quantity: item.quantity,
          pct: totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 1000) / 10 : 0,
        })),
        topSellingBooks: topSellingBooks.map((item) => ({
          bookId: item._id,
          title: item.title,
          revenue: Math.round(item.revenue * 100) / 100,
          quantity: item.quantity,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

// Revenue overview — public diagnostic (remove after testing)
router.get('/revenue-public', async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalRevenueResult,
      monthRevenueResult,
      yearRevenueResult,
      totalOrders,
      monthOrders,
      revenueByGenre,
      topSellingBooks,
    ] = await Promise.all([
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.aggregate([
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'books',
            localField: 'items.bookId',
            foreignField: '_id',
            as: 'bookData',
          },
        },
        {
          $group: {
            _id: { $arrayElemAt: ['$bookData.genre', 0] },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            quantity: { $sum: '$items.quantity' },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
      Order.aggregate([
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.bookId',
            title: { $first: '$items.title' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            quantity: { $sum: '$items.quantity' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const totalRevenue = totalRevenueResult[0] ? totalRevenueResult[0].total : 0;
    const monthRevenue = monthRevenueResult[0] ? monthRevenueResult[0].total : 0;
    const yearRevenue = yearRevenueResult[0] ? yearRevenueResult[0].total : 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    res.json({
      revenue: {
        totalRevenue,
        monthRevenue,
        yearRevenue,
        totalOrders,
        monthOrders,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        revenueByGenre: revenueByGenre.map((item) => ({
          genre: item._id,
          revenue: Math.round(item.revenue * 100) / 100,
          quantity: item.quantity,
          pct: totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 1000) / 10 : 0,
        })),
        topSellingBooks: topSellingBooks.map((item) => ({
          bookId: item._id,
          title: item.title,
          revenue: Math.round(item.revenue * 100) / 100,
          quantity: item.quantity,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
