const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;
const CUSTOMER_SECRET_KEY = process.env.CUSTOMER_SECRET_KEY;
const jwt = require("jsonwebtoken");
const { successResponse, errorResponse } = require("../utils/response");

const checkLogin = (req, res, next) => {
  if (!req.headers.authorization) {
    return errorResponse(res, "Unauthorized", "No token provided", 401);
  }

  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return errorResponse(res, "Unauthorized", "No token provided", 401);
  }

  try {
    // Kiểm tra admin trước
    try {
      const admin = jwt.verify(token, ADMIN_SECRET_KEY);
      req.user = admin;
      return next();
    } catch (err) {
      // Không phải admin, thử customer
    }
    const customer = jwt.verify(token, CUSTOMER_SECRET_KEY);
    req.user = customer;
    return next();
  } catch (error) {
    return errorResponse(res, "Unauthorized", "Invalid token", 401);
  }
};

module.exports = {
  checkLogin,
};
