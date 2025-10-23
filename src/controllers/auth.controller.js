const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;
const CUSTOMER_SECRET_KEY = process.env.CUSTOMER_SECRET_KEY;
const bcrypt = require("bcrypt");
const { successResponse, errorResponse } = require("../utils/response");

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

const verifyAdminToken = (req, res) => {
  const { token } = req.body;

  if (!token) {
    return errorResponse(res, "verification failed", "No token provided", 401);
  }
  try {
    const decoded = jwt.verify(token, ADMIN_SECRET_KEY);
    if (decoded) {
      return successResponse(res, "verification successful", decoded, 200);
    } else {
      return errorResponse(res, "verification failed", "Invalid token", 401);
    }
  } catch (error) {
    return errorResponse(res, "verification failed", "Invalid token", 401);
  }
};

const adminLogin = async (req, res) => {
  const data = req.body;
  console.log(data);
  const { email, password } = data;

  const existingAdmin = await userModel.adminLogin(email, password);
  if (!existingAdmin) {
    return errorResponse(res, "Login failed", "Invalid email or password", 401);
  }

  const token = createAdminToken(existingAdmin);
  return successResponse(res, "Login successful", { admin: existingAdmin, token }, 200);
};

const createAdmin = async (req, res) => {
  const data = req.body;
  data.password = await bcrypt.hash(data.password, 10);
  const newAdmin = await userModel.createAdmin(data);
  const token = createAdminToken(newAdmin);
  return successResponse(res, "Admin created successfully", { admin: newAdmin, token }, 201);
};

const verifyCustomerToken = (req, res) => {
  const { token } = req.body;
  if (!token) {
    return errorResponse(res, "verification failed", "No token provided", 401);
  }
  try {
    const decoded = jwt.verify(token, CUSTOMER_SECRET_KEY);
    if (decoded) {
      return successResponse(res, "verification successful", decoded, 200);
    } else {
      return errorResponse(res, "verification failed", "Invalid token", 401);
    }
  } catch (error) {
    console.error("Error during token verification:", error);
    return errorResponse(res, "verification failed", "Invalid token", 401);
  }
}

const customerLogin = async (req, res) => {
  const data = req.body;
  const { email, password } = data;

  const existingCustomer = await userModel.customerLogin(email, password);
  if (!existingCustomer) {
    return errorResponse(res, "Login failed", "Invalid email or password", 401);
  }
  const token = createCustomerToken(existingCustomer);
  return successResponse(res, "Login successful", { customer: existingCustomer, token }, 200);
};

const createCustomer = async (req, res) => {
  const data = req.body;
  const errorMessages = [];
  const emailExists = await userModel.checkCustomerEmail(data.email);
  if (emailExists) {
    errorMessages.push("Email already in use");
  }
  const phoneExists = await userModel.checkCustomerPhone(data.phone);
  if (phoneExists) {
    errorMessages.push("Phone number already in use");
  }
  
  if (errorMessages.length > 0) {
    return errorResponse(res, "Customer creation failed", errorMessages, 400);
  }

  data.password = await bcrypt.hash(data.password, 10);
  const newCustomer = await userModel.createCustomer(data);
  const token = createCustomerToken(newCustomer);
  return successResponse(res, "Customer created successfully", { customer: newCustomer, token }, 201);
};

module.exports = {
  adminLogin,
  createAdmin,
  customerLogin,
  createCustomer,
  verifyAdminToken,
  verifyCustomerToken
};
