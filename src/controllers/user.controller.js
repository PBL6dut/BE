const userModel = require("../models/user.model");
const validateUser = require("../validations/user.validation");
const bcrypt = require("bcrypt");
const { successResponse, errorResponse } = require("../utils/response");
const { createCustomerToken } = require("./auth.controller");

const checkCustomerAuth = (req, customerId) => {
  const { id } = req.user;
  return id === customerId;
};

const getAllCustomers = async (req, res) => {
  const customers = await userModel.getAllCustomers();
  return successResponse(res, "Get all customers success", customers);
};

const getCustomerById = async (req, res) => {
  const customerId = parseInt(req.params.id);
  const { role } = req.user;
  if (role !== "admin" && !checkCustomerAuth(req, customerId)) {
    return errorResponse(res, "Forbidden", "Access is denied", null, 403);
  }
  const customer = await userModel.getCustomerById(customerId);
  return successResponse(res, "Get customer success", customer);
};

const createCustomer = async (req, res) => {
  const customerData = req.body;

  const emailExists = await userModel.checkCustomerEmail(customerData.email);
  if (emailExists) {
    return errorResponse(res, "Validation failed", "Email already exists", 400);
  }

  const newCustomer = await userModel.createCustomer(customerData);
  const token = await createCustomerToken(newCustomer);
  return successResponse(res, "Customer created successfully", { customer: newCustomer, token }, 201);
};

const updateCustomer = async (req, res) => {
  const customerId = parseInt(req.params.id);
  const { role } = req.user;
  if (role !== "admin" && !checkCustomerAuth(req, customerId)) {
    return errorResponse(res, "Forbidden", "Access is denied", null, 403);
  }

  const customerData = req.body;

  const emailExists = await userModel.checkCustomerEmail(customerData.email);
  if (emailExists) {
    return errorResponse(res, "Validation failed", "Email already exists", 400);
  }

  const updatedCustomer = await userModel.updateCustomer(
    customerId,
    customerData
  );
  return successResponse(res, "Customer updated successfully", updatedCustomer);
};

const deleteCustomer = async (req, res) => {
  const customerId = parseInt(req.params.id);
  const { role } = req.user;

  if (role !== "admin" && !checkCustomerAuth(req, customerId)) {
    return errorResponse(res, "Forbidden", "Access is denied", null, 403);
  }

  await userModel.deleteCustomer(customerId);
  return successResponse(res, "Customer deleted successfully");
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
