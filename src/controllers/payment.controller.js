const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require("vnpay")
const { successResponse, errorResponse } = require("../utils/response")

const createQRPayment = async (req, res) => {
    const vnpay = new VNPay({
        tmnCode: process.env.VNP_TMNCODE,
        secureSecret: process.env.VNP_HASHSECRET,
        vnpayHost: process.env.VNP_PAYURL,
        testMode: true,
        hashAlgorithm: "SHA512",
        loggerFn: ignoreLogger
    })

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const vnpayResponse = await vnpay.buildPaymentUrl({
        vnp_Amount: 50000,
        vnp_IpAddr: req.ip,
        vnp_TxnRef: '11',
        vnp_OrderInfo: 'Thanh toan don hang',
        vnp_OrderType: ProductCode.Other,
        vnp_ReturnUrl: 'http://localhost:3000/api/payment/check-payment',
        vnp_Locale: VnpLocale.VN,
        vnp_CreateDate: dateFormat(new Date()),
        vnp_ExpireDate: dateFormat(tomorrow)
    })

    return successResponse(res, 'Create QR Payment Success', {paymentUrl: vnpayResponse}, 201)
}

const checkPayment = async (req, res) => {
    console.log('Payment Check:', req.query)
    return successResponse(res, 'Check Payment Success', req.query, 200)
}

module.exports = {
    createQRPayment,
    checkPayment
}