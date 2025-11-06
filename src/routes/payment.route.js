
const express = require('express')
const router = express.Router()
const paymentController = require('../controllers/payment.controller')

router.post('/create-qr', paymentController.createQRPayment)
router.get('/check-payment', paymentController.checkPayment)
router.get('/provinces', paymentController.getProvinces)
router.get('/districts/:province_id', paymentController.getDistricts)
router.get('/wards/:district_id', paymentController.getWards)
router.post('/shipping-services', paymentController.getShippingServices)
router.post('/shipping-fee', paymentController.calculateShippingFee)


module.exports = router