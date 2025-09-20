const express = require('express')
const router = express.Router()
const app = express()


router.use('/auth', require('./auth.route'))
router.use('/user', require('./user.route'))
router.use('/order', require('./order.route'))
router.use('/product', require('./product.route'))

module.exports = router