const express = require('express')
const router = express.Router()
const orderController = require('../controllers/order.controller')
const authMiddleware = require('../middlewares/auth.middleware')

const requireAuth = authMiddleware.checkLogin
router.use(requireAuth)
router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);
router.get('/customer/:customer_id', orderController.getOrdersByCustomer);

module.exports = router;