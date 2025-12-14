const {
  VNPay,
  ignoreLogger,
  ProductCode,
  VnpLocale,
  dateFormat,
} = require("vnpay");
const { successResponse, errorResponse } = require("../utils/response");
const { axios } = require("axios");
const { StatusCodes } = require("http-status-codes");
const GHN_API_URL = process.env.GHN_API_URL;
const GHN_TOKEN_SANDBOX = process.env.GHN_TOKEN_SANDBOX;
const GHN_SHOP_ID_SANDBOX = process.env.GHN_SHOP_ID_SANDBOX;
const GHN_API_PROVINCES = process.env.GHN_API_PROVINCES;
const GHN_API_DISTRICTS = process.env.GHN_API_DISTRICTS;
const GHN_API_WARDS = process.env.GHN_API_WARDS;
const paymentservice = require("../services/payment.service");
const orderservice = require("../services/order.service");
const { default: ApiError } = require("../utils/ApiError");

const createQRPayment = async (req, res) => {
  const vnpay = new VNPay({
    tmnCode: process.env.VNP_TMNCODE,
    secureSecret: process.env.VNP_HASHSECRET,
    vnpayHost: process.env.VNP_PAYURL,
    testMode: true,
    hashAlgorithm: "SHA512",
    loggerFn: ignoreLogger,
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const vnpayResponse = await vnpay.buildPaymentUrl({
    vnp_Amount: 50000,
    vnp_IpAddr: req.ip,
    vnp_TxnRef: "11",
    vnp_OrderInfo: "Thanh toan don hang",
    vnp_OrderType: ProductCode.Other,
    vnp_ReturnUrl: "http://localhost:3000/api/payment/check-payment",
    vnp_Locale: VnpLocale.VN,
    vnp_CreateDate: dateFormat(new Date()),
    vnp_ExpireDate: dateFormat(tomorrow),
  });

  return successResponse(
    res,
    "Create QR Payment Success",
    { paymentUrl: vnpayResponse },
    201
  );
};

const getProvinces = async (req, res, next) => {
  try {
    const provinces = await paymentservice.getProvinces();
    return successResponse(res, "Get Provinces Success", provinces, 200);
  } catch (error) {
    next(error);
  }
};

const getDistricts = async (req, res, next) => {
  try {
    if (!req.params.province_id) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Get Districts Failed",
        "Province ID is required"
      );
    }
    console.log("Province ID:", req.params.province_id);

    const districts = await paymentservice.getDistricts(req.params.province_id);
    return successResponse(res, "Get Districts Success", districts, 200);
  } catch (error) {
    next(error);
  }
};

const getWards = async (req, res, next) => {
  try {
    if (!req.params.district_id) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Get Wards Failed",
        "District ID is required"
      );
    }

    const wards = await paymentservice.getWards(req.params.district_id);
    return successResponse(res, "Get Wards Success", wards, 200);
  } catch (error) {
    next(error);
  }
};

const getShippingServices = async (req, res, next) => {
  try {
    const { to_district_id } = req.body;
    if (!to_district_id) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Get Shipping Services Failed",
        "To District ID is required"
      );
    }
    const services = await paymentservice.getShippingServices(to_district_id);
    return successResponse(res, "Get Shipping Services Success", services, 200);
  } catch (error) {
    next(error);
  }
};

const calculateShippingFee = async (req, res, next) => {
  try {
    // console.log(req.body)
    if (!req.body) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Calculate Shipping Fee Failed",
        "No data provided"
      );
    }

    const {
      to_district_id,
      to_ward_code,
      weight,
      length,
      width,
      height,
      price,
    } = req.body;
    if (
      !to_district_id ||
      !to_ward_code ||
      !weight ||
      !length ||
      !width ||
      !height ||
      !price
    ) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Calculate Shipping Fee Failed",
        "Missing required parameters"
      );
    }

    const shippingFee = await paymentservice.calculateShippingFee(
      price,
      to_district_id,
      to_ward_code,
      height,
      length,
      width,
      weight
    );

    return successResponse(
      res,
      "Calculate Shipping Fee Success",
      { shippingFee },
      200
    );
  } catch (error) {
    next(error);
  }
};

const getExpectedDeliveryDate = async (req, res, next) => {
  try {
    const { to_district_id, to_ward_code } = req.body;
    if (!to_district_id || !to_ward_code) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Get Expected Delivery Date Failed",
        "Missing required parameters"
      );
    }
    const expectedDeliveryDate = await paymentservice.getExpectedDeliveryDate(
      to_district_id,
      to_ward_code
    );
    return successResponse(
      res,
      "Get Expected Delivery Date Success",
      { expectedDeliveryDate },
      200
    );
  } catch (error) {
    next(error);
  }
};

const checkPayment = async (req, res, next) => {
  try {
    const { content, transferAmount } = req.body;

    // Kiểm tra dữ liệu đầu vào từ webhook
    if (!content || transferAmount === undefined) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Webhook Error",
        "Missing 'content' or 'transferAmount' in webhook payload."
      );
    }

    // Trích xuất order_number từ nội dung chuyển khoản.
    // Giả định order_number có định dạng "ORD-..." và nằm trong chuỗi content.
    const match = content.match(/ORD\d+/);
    if (!match) {
      // Nếu không tìm thấy order_number, có thể đây là một giao dịch không liên quan
      console.log(
        "Webhook received, but no valid order number found in content."
      );
      return successResponse(
        res,
        "Webhook received, but no order number found.",
        { received: true },
        200
      );
    }

    const orderNumber = match[0];

    // Gọi service để cập nhật trạng thái đơn hàng
    await orderservice.updateOrderStatusAfterPayment(orderNumber, transferAmount);

    const io = req.app.get("io");
    io.to(`${orderNumber}`).emit("paymentConfirmed", {
      orderNumber,
      transferAmount,
    });

    return successResponse(
      res,
      `Payment for order ${orderNumber} confirmed successfully.`,
      { received: true },
      200
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQRPayment,
  checkPayment,
  getProvinces,
  getDistricts,
  getWards,
  getShippingServices,
  calculateShippingFee,
  getExpectedDeliveryDate,
};
