const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/orderController');
const { protect } = require('../middlewares/auth');

router.post('/',         ctrl.placeOrder);
router.get('/mine',      protect, ctrl.getMyOrders);
router.post('/create',   protect, ctrl.createFromCart);
router.get('/history',   protect, ctrl.getOrderHistory);
router.get('/:id',       protect, ctrl.getOrderById);

module.exports = router;
