const express = require('express')
const router = express.Router()
const authController = require('../controllers/auth.controller')
const validateCustomer = require('../validations/user.validation')
const { validateCreateCustomer } = require('../validations/user.validation')
const { checkEmptyData } = require('../middlewares/checkEmptyData.middleware')

router.post('/admin/verify-token', authController.verifyAdminToken);
router.post('/admin/login', checkEmptyData, authController.adminLogin);
router.post('/admin/create', checkEmptyData, authController.createAdmin);
router.post('/customer/verify-token', authController.verifyCustomerToken);
router.post('/customer/login', checkEmptyData, authController.customerLogin);
router.post('/customer/create', checkEmptyData, validateCreateCustomer, authController.createCustomer);

module.exports = router