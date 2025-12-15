const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;
const CUSTOMER_SECRET_KEY = process.env.CUSTOMER_SECRET_KEY;
const jwt = require("jsonwebtoken");
const { successResponse, errorResponse } = require("../utils/response");
const { default: ApiError } = require("../utils/ApiError");
const { StatusCodes } = require("http-status-codes");

const checkLogin = (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        "Unauthorized",
        "No token provided"
      );
    }

    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        "Unauthorized",
        "No token provided"
      );
    }

    console.log("🔍 Token received:", token.substring(0, 20) + "...");

    // Kiểm tra admin trước
    try {
      const admin = jwt.verify(token, ADMIN_SECRET_KEY);
      console.log("✅ Admin token verified successfully");
      req.user = admin;
      return next();
    } catch (err) {
      console.log("⚠️ Admin token verification failed:", err.name);
      // Không phải admin, thử customer
    }

    try {
      const customer = jwt.verify(token, CUSTOMER_SECRET_KEY);
      console.log("✅ Customer token verified successfully");
      req.user = customer;
      return next();
    } catch (err) {
      console.log("❌ Customer token verification failed:", err.name, err.message);
      throw err;
    }
  } catch (error) {
    console.log("❌ Authentication error:", error.name, error.message);
    return errorResponse(res, "Unauthorized", "Invalid token", 401);
  }
};

module.exports = {
  checkLogin,
};
