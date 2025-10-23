const express = require('express')
const router = express.Router()
const app = express()

router.use('/auth', require('./auth.route'))
router.use('/users', require('./user.route'))
router.use('/orders', require('./order.route'))
router.use('/products', require('./product.route'))
router.use('/payment', require('./payment.route'))

module.exports = router