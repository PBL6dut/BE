const userModel = require("../models/user.model");
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
    if (!req.body) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Verification failed",
        "No token provided"
      );
    }

    const { token } = req.body;

    const decoded = jwt.verify(token, ADMIN_SECRET_KEY);
    return successResponse(res, "Verification successful", { token }, 200);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        "Verification failed",
        "Token has expired"
      );
    }
    next(error);
  }
};

const adminLogin = async (req, res, next) => {
  try {
    if (!req.body) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Login failed",
        "No data provided"
      );
    }

    const data = req.body;

    const { email, password } = data;
    if (!email || !password) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Login failed",
        "Email and password are required"
      );
    }

    const existingAdmin = await userModel.adminLogin(email, password);

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

    const newAdmin = await userModel.createAdmin(data);
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
    if (!data) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Login failed",
        "No data provided"
      );
    }

    const { email, password } = data;
    if (!email || !password) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Login failed",
        "Email and password are required"
      );
    }

    const existingCustomer = await userModel.customerLogin(email, password);
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
    if (!data) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Customer creation failed",
        "No data provided"
      );
    }

    const newCustomer = await userModel.createCustomer(data);
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
