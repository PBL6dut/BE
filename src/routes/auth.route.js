const express = require('express')
const router = express.Router()
const authController = require('../controllers/auth.controller')
const validateCustomer = require('../validators/user/user.validator')
const { validateCreateCustomer } = require('../validators/user/user.validator')
const { validateLogin } = require('../validators/auth/login.validator')

router.get('/admin/verify-token', authController.verifyAdminToken);
router.post('/admin/login', validateLogin, authController.adminLogin);
router.post('/admin/create', validateCreateCustomer, authController.createAdmin);
router.post('/customer/verify-token', authController.verifyCustomerToken);
router.post('/customer/login', validateLogin, authController.customerLogin);
router.post('/customer/create', validateCreateCustomer, authController.createCustomer);

module.exports = router