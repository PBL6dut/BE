const express = require('express')
const router = express.Router()
const userController = require('../controllers/user.controller')
const authMiddleware = require('../middlewares/auth.middleware')
const validateCustomer = require('../validations/user.validation')

const requireAuth = authMiddleware.checkLogin
const { validateUpdateCustomer } = require('../validations/user.validation')

router.use(requireAuth)
router.get('/customer/list', userController.getAllCustomers);
router.get('/customer/detail/:id', userController.getCustomerById);
router.put('/customer/update/:id', validateUpdateCustomer, userController.updateCustomer);
router.delete('/customer/delete/:id', userController.deleteCustomer);

module.exports = router;