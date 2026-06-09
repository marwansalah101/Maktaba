const Book   = require('../models/Book');
const Author = require('../models/Author');
const User   = require('../models/user');
const Order  = require('../models/Order');

exports.getStats = async (req, res, next) => {
    try {
        const now          = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalBooks,
            totalAuthors,
            totalUsers,
            totalOrders,
            newBooksThisMonth,
            authorsAddedThisMonth,
            lowStockBooks,
            totalStockResult,
            genreCounts,
            recentOrders,
        ] = await Promise.all([
            Book.countDocuments(),
            Author.countDocuments(),
            User.collection.countDocuments({}),
            Order.collection.countDocuments({}),
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
            Order.find({})
                .sort({ createdAt: -1 })
                .limit(8)
                .select('orderNumber userEmail totalAmount orderStatus items createdAt paymentMethod')
                .lean(),
        ]);

        const totalStock     = totalStockResult[0] ? totalStockResult[0].total : 0;
        const genreBreakdown = genreCounts.map(item => ({
            genre: item._id,
            count: item.count,
            pct:   totalBooks > 0 ? Math.round((item.count / totalBooks) * 1000) / 10 : 0,
        }));
        const recentOrdersSummary = recentOrders.map(order => ({
            _id: order._id,
            orderNumber: order.orderNumber,
            userEmail: order.userEmail,
            totalAmount: order.totalAmount,
            orderStatus: order.orderStatus,
            paymentMethod: order.paymentMethod,
            createdAt: order.createdAt,
            itemsCount: Array.isArray(order.items)
                ? order.items.reduce((sum, item) => sum + (Number(item.quantity || item.qty || 1) || 1), 0)
                : 0,
        }));

        res.json({
            stats: {
                totalBooks,
                totalAuthors,
                totalUsers,
                totalOrders,
                newBooksThisMonth,
                authorsAddedThisMonth,
                totalStock,
                lowStockBooks,
                genreBreakdown,
                recentOrders: recentOrdersSummary,
            },
        });
    } catch (err) {
        next(err);
    }
};
