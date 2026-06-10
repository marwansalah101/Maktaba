const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/orderController');
const { protect, adminOnly } = require('../middlewares/auth');
const { orderRules, validate } = require('../middlewares/validators');

router.post('/',                          orderRules, validate, ctrl.placeOrder);
router.get('/mine',      protect,         ctrl.getMyOrders);
router.post('/create',   protect,         ctrl.createFromCart);
router.get('/history',   protect,         ctrl.getOrderHistory);
router.patch('/:id/status', protect, adminOnly, ctrl.updateStatus);
router.get('/:id',       protect,         ctrl.getOrderById);

module.exports = router;
