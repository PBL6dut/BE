
const express = require('express')
const router = express.Router()
const paymentController = require('../controllers/payment.controller')

router.post('/create-qr', paymentController.createQRPayment)
router.get('/check-payment', paymentController.checkPayment)

module.exports = router