const userservice = require("../services/user.service");
const validateUser = require("../validators/user/user.validator");
const bcrypt = require("bcrypt");
const { successResponse, errorResponse } = require("../utils/response");
const { createCustomerToken } = require("./auth.controller");
const { default: ApiError } = require("../utils/ApiError");
const { StatusCodes } = require("http-status-codes");
const paginationQueryValidator = require("../validators/pagination-query.validator");

const getAllCustomers = async (req, res, next) => {
  try {
    const { page: pageStr, pageSize: pageSizeStr, ...rest } = req.query;
    let page = pageStr ? parseInt(pageStr, 10) : 1;
    let limit = pageSizeStr ? parseInt(pageSizeStr, 10) : 10;
    const customers = await userservice.getAllCustomers(limit, page);
    return successResponse(res, "Get all customers success", customers);
  } catch (error) {
    next(error);
  }
};

const getCurrentCustomer = async (req, res, next) => {
  try {
    const { id } = req.user;
    const customer = await userservice.getCurrentCustomer(id);
    return successResponse(res, "Get current customer success", customer, StatusCodes.OK);
  } catch (error) {
    next(error);
  }
}

const checkCustomerAuth = (req, customerId) => {
  const { id } = req.user;
  return id === customerId;
};

const countCustomers = async (req, res, next) => {
  try {
    const count = await userservice.countCustomers();
    return successResponse(
      res,
      "Count customers success",
      count,
      StatusCodes.OK
    );
  } catch (error) {
    next(error);
  }
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

    const customer = await userservice.getCustomerById(customerId);
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

    const updatedCustomer = await userservice.updateCustomer(
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

    await userservice.deleteCustomer(customerId);
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
  countCustomers,
  getCurrentCustomer,
};
