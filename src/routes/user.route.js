const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/auth.middleware')
const userController = require('../controllers/user.controller')

const { validateUpdateCustomer } = require('../validators/user/user.validator')
const { validatePaginationQuery } = require('../validators/pagination-query.validator')
const requireAuth = authMiddleware.checkLogin

router.use(requireAuth)
router.get('/customers/', validatePaginationQuery, userController.getAllCustomers);
router.get('/customers/count', userController.countCustomers);
router.get('/customers/me', userController.getCurrentCustomer);
router.get('/customers/:id', userController.getCustomerById);
router.put('/customers/:id', validateUpdateCustomer, userController.updateCustomer);
router.delete('/customers/:id', userController.deleteCustomer);

module.exports = router;