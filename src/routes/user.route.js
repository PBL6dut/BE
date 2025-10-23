const express = require('express')
const router = express.Router()
const userController = require('../controllers/user.controller')
const authMiddleware = require('../middlewares/auth.middleware')
const { checkEmptyData } = require('../middlewares/checkEmptyData.middleware')

const requireAuth = authMiddleware.checkLogin
const { validateUpdateCustomer } = require('../validations/user.validation')

router.use(requireAuth)
router.get('/customers/', userController.getAllCustomers);
router.get('/customers/:id', userController.getCustomerById);
router.put('/customers/:id', checkEmptyData, validateUpdateCustomer, userController.updateCustomer);
router.delete('/customers/:id', userController.deleteCustomer);

module.exports = router;