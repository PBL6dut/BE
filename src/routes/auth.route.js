const express = require('express')
const router = express.Router()
const authController = require('../controllers/auth.controller')
const validateCustomer = require('../validations/user/user.validation')
const { validateCreateCustomer } = require('../validations/user/user.validation')

router.get('/admin/verify-token', authController.verifyAdminToken);
router.post('/admin/login', authController.adminLogin);
router.post('/admin/create', authController.createAdmin);
router.post('/customer/verify-token', authController.verifyCustomerToken);
router.post('/customer/login', authController.customerLogin);
router.post('/customer/create', validateCreateCustomer, authController.createCustomer);

module.exports = router