const express = require('express')
const router = express.Router()
const orderController = require('../controllers/order.controller')
const authMiddleware = require('../middlewares/auth.middleware')
const { validateCreateOrder } = require('../validations/order.validation')

const requireAuth = authMiddleware.checkLogin
router.use(requireAuth)
router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);
router.get('/customers/:customer_id', orderController.getOrdersByCustomer);
router.post('/', validateCreateOrder, orderController.createOrder);

module.exports = router;