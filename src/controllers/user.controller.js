const userModel = require("../models/user.model");
const validateUser = require("../validations/user/user.validation");
const bcrypt = require("bcrypt");
const { successResponse, errorResponse } = require("../utils/response");
const { createCustomerToken } = require("./auth.controller");
const { default: ApiError } = require("../utils/ApiError");
const { StatusCodes } = require("http-status-codes");

const checkCustomerAuth = (req, customerId) => {
  const { id } = req.user;
  return id === customerId;
};

const getAllCustomers = async (req, res) => {
  const customers = await userModel.getAllCustomers();
  return successResponse(res, "Get all customers success", customers);
};

const getCustomerById = async (req, res, next) => {
  try {
    if (!req.params.id) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Get customer failed",
        "No customer ID provided"
      );
    }

    const customerId = parseInt(req.params.id);
    const { role } = req.user;

    if (role !== "admin" && !checkCustomerAuth(req, customerId)) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "Forbidden",
        "Access is denied"
      );
    }

    const customer = await userModel.getCustomerById(customerId);
    return successResponse(res, "Get customer success", customer);
  } catch (error) {
    next(error);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    if (!req.params.id) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Update customer failed",
        "No customer ID provided"
      );
    }

    const customerId = parseInt(req.params.id);
    const { role } = req.user;
    if (role !== "admin" && !checkCustomerAuth(req, customerId)) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "Update customer failed",
        "Access is denied"
      );
    }

    const customerData = req.body;

    const updatedCustomer = await userModel.updateCustomer(
      customerId,
      customerData
    );
    return successResponse(
      res,
      "Customer updated successfully",
      updatedCustomer,
      201
    );
  } catch (error) {
    next(error);
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    if (!customerId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Delete customer failed",
        "No customer ID provided"
      );
    }

    const { role } = req.user;

    if (role !== "admin" && !checkCustomerAuth(req, customerId)) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "Delete customer failed",
        "Access is denied"
      );
    }

    await userModel.deleteCustomer(customerId);
    return successResponse(res, "Customer deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};
