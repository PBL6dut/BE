const authService = require("../services/auth.service");
const jwt = require("jsonwebtoken");
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;
const CUSTOMER_SECRET_KEY = process.env.CUSTOMER_SECRET_KEY;
const { successResponse, errorResponse } = require("../utils/response");
const { default: ApiError } = require("../utils/ApiError");
const { StatusCodes } = require("http-status-codes");

const createAdminToken = (admin) => {
  const token = jwt.sign(
    { id: admin.id, email: admin.email, role: "admin" },
    ADMIN_SECRET_KEY,
    {
      expiresIn: "1h",
    }
  );
  return token;
};

const createCustomerToken = (customer) => {
  const token = jwt.sign(
    { id: customer.id, email: customer.email, role: "customer" },
    CUSTOMER_SECRET_KEY,
    {
      expiresIn: "24h",
    }
  );
  return token;
};

const verifyAdminToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return errorResponse(res, "Unauthorized", "No token provided", 401);
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return errorResponse(res, "Unauthorized", "No token provided", 401);
    }

    // Dùng ADMIN_SECRET_KEY và verify đồng bộ để đơn giản
    const decoded = jwt.verify(token, ADMIN_SECRET_KEY);
    return successResponse(res, "Verification successful", { admin: decoded }, 200);
  } catch (error) {
    if (error && error.name === "TokenExpiredError") {
      return errorResponse(res, "Verification failed", "Token has expired", 401);
    }
    return errorResponse(res, "Unauthorized", "Invalid token", 401);
  }
};

const adminLogin = async (req, res, next) => {
  try {
    const data = req.body;
    const { email, password } = data;

    const existingAdmin = await authService.adminLogin(email, password);

    const token = createAdminToken(existingAdmin);
    return successResponse(
      res,
      "Login successful",
      { admin: existingAdmin, token },
      200
    );
  } catch (error) {
    next(error);
  }
};

const createAdmin = async (req, res, next) => {
  try {
    const data = req.body;
    if (!data) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Admin creation failed",
        "No data provided"
      );
    }

    const newAdmin = await authService.createAdmin(data);
    const token = createAdminToken(newAdmin);
    return successResponse(
      res,
      "Admin created successfully",
      { admin: newAdmin, token },
      201
    );
  } catch (error) {
    next(error);
  }
};

const verifyCustomerToken = (req, res, next) => {
  try {
    if (!req.body) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Verification failed",
        "No token provided"
      );
    }

    const { token } = req.body;
    if (!token) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Verification failed",
        "No token provided"
      );
    }

    const decoded = jwt.verify(token, CUSTOMER_SECRET_KEY);
    return successResponse(res, "Verification successful", { token }, 200);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        "Verification failed",
        "Token has expired"
      );
    }
    next(error);
  }
};

const customerLogin = async (req, res, next) => {
  try {
    const data = req.body;

    const { email, password } = data;

    const existingCustomer = await authService.customerLogin(email, password);
    if (!existingCustomer) {
      return errorResponse(
        res,
        "Login failed",
        "Invalid email or password",
        401
      );
    }
    const token = createCustomerToken(existingCustomer);
    return successResponse(
      res,
      "Login successful",
      { customer: existingCustomer, token },
      200
    );
  } catch (error) {
    next(error);
  }
};

const createCustomer = async (req, res, next) => {
  try {
    const data = req.body;
    const newCustomer = await authService.createCustomer(data);
    const token = createCustomerToken(newCustomer);
    return successResponse(
      res,
      "Customer created successfully",
      { customer: newCustomer, token },
      201
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  adminLogin,
  createAdmin,
  customerLogin,
  createCustomer,
  verifyAdminToken,
  verifyCustomerToken,
};
