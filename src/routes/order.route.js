const express = require('express')
const router = express.Router()
const orderController = require('../controllers/order.controller')
const authMiddleware = require('../middlewares/auth.middleware')
const { validateCreateOrder } = require('../validators/order/order.validator')

const requireAuth = authMiddleware.checkLogin
router.use(requireAuth)
router.get('/', orderController.getAllOrders);
router.get('/count', orderController.countOrders);
router.get('/total-income', orderController.totalIncome);
router.get('/:id', orderController.getOrderById);
router.get('/customers/:customer_id', orderController.getOrdersByCustomer);
router.post('/', validateCreateOrder, orderController.createOrder);

module.exports = router;