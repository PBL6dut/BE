const express = require('express')
const router = express.Router()
const app = express()
const { StatusCodes } = require('http-status-codes')
const { default: ApiError } = require('../utils/ApiError')

router.use('/auth', require('./auth.route'))
router.use('/users', require('./user.route'))
router.use('/orders', require('./order.route'))
router.use('/products', require('./product.route'))
router.use('/payment', require('./payment.route'))

// Middleware để bắt các route không tồn tại (404 Not Found)
// Middleware này sẽ được thực thi nếu không có route nào ở trên khớp với yêu cầu.
router.use((req, res, next) => {
  const error = new ApiError(StatusCodes.NOT_FOUND, 'Not Found', 'API endpoint not found');
  next(error);
});

module.exports = router