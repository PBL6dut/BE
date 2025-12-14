
const express = require('express')
const router = express.Router()
const paymentController = require('../controllers/payment.controller')

router.get('/provinces', paymentController.getProvinces)
router.get('/districts/:province_id', paymentController.getDistricts)
router.get('/wards/:district_id', paymentController.getWards)
router.post('/shipping-services', paymentController.getShippingServices)
router.post('/shipping-fee', paymentController.calculateShippingFee)
router.post('/expected-delivery-date', paymentController.getExpectedDeliveryDate)
router.post('/check-payment', paymentController.checkPayment)


module.exports = router