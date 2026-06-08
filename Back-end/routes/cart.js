const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/cartController');
router.get('/',                    ctrl.getCart);
router.post('/add',                ctrl.addToCart);
router.put('/update/:bookId',      ctrl.updateCartItem);
router.delete('/remove/:bookId',   ctrl.removeFromCart);
router.delete('/clear',            ctrl.clearCart);
module.exports = router;
