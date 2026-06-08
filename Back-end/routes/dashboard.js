const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/dashboardController');
const { protect, adminOnly } = require('../middlewares/auth');

router.get('/stats', protect, adminOnly, ctrl.getStats);

module.exports = router;
