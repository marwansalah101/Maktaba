const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Author = require('../models/Author');
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

module.exports = router;
