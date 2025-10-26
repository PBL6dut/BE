const orderModel = require("../models/order.model");
const { successResponse, errorResponse } = require("../utils/response");
const { getProductById } = require("../models/product.model");
const { default: ApiError } = require("../utils/ApiError");
const { StatusCodes } = require("http-status-codes");

const getAllOrders = async (req, res, next) => {
  try {
    const orders = await orderModel.getAllOrders();
    return successResponse(res, "Get all orders success", orders);
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    if (!req.params.id) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Get order failed",
        "Order ID is required"
      );
    }

    if (isNaN(parseInt(req.params.id))) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Get order failed",
        "Order ID must be a number"
      );
    }

    const orderId = parseInt(req.params.id);
    const order = await orderModel.getOrderById(orderId);
    return successResponse(res, "Get order success", order);
  } catch (error) {
    next(error);
  }
};

const getOrdersByCustomer = async (req, res, next) => {
  try {
    if (!req.params.customer_id) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Get orders by customer failed",
        "Customer ID is required"
      );
    }

    if (isNaN(parseInt(req.params.customer_id))) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Get orders by customer failed",
        "Customer ID must be a number"
      );
    }

    const { role } = req.user;
    const customerId = parseInt(req.params.customer_id);
    if (role !== "admin" && req.user.id !== customerId) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "Get orders by customer failed",
        "Access is denied"
      );
    }

    const orders = await orderModel.getOrdersByCustomer(customerId);
    return successResponse(res, "Get orders by customer success", orders);
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const data = req.body;
    if (!data) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Create order failed",
          "No data provided"
        );
    }

    if (data.customer_id) {
      data.customer_id = parseInt(data.customer_id, 10);
    }

    data.order_details.forEach((item) => {
      if (item.product_id) item.product_id = parseInt(item.product_id, 10);
      if (item.quantity) item.quantity = parseInt(item.quantity, 10);
    });

    const newOrder = await orderModel.createOrder(data);
    return successResponse(res, "Create order success", newOrder, 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  getOrdersByCustomer,
  createOrder,
};
