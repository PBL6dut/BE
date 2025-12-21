const orderservice = require("../services/order.service");
const { successResponse, errorResponse } = require("../utils/response");
const { getProductById } = require("../services/product.service");
const { default: ApiError } = require("../utils/ApiError");
const { StatusCodes } = require("http-status-codes");

const getStatistics = async (req, res, next) => {
  try {
    const stats = await orderservice.getStatistics();
    return successResponse(res, "Get order statistics success", stats, StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const { page: pageStr, pageSize: pageSizeStr, ...rest } = req.query;
    let page = pageStr ? parseInt(pageStr, 10) : 1;
    let limit = pageSizeStr ? parseInt(pageSizeStr, 10) : 10;
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;
    const orders = await orderservice.getAllOrders(page, limit);
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
    const order = await orderservice.getOrderById(orderId);
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

    const orders = await orderservice.getOrdersByCustomer(customerId);
    return successResponse(res, "Get orders by customer success", orders);
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const data = req.body;
    const customer_id = req.user.id;

    data.customer_id = customer_id;
    
    data.order_details.forEach((item) => {
      if (item.product_id) item.product_id = parseInt(item.product_id, 10);
      if (item.quantity) item.quantity = parseInt(item.quantity, 10);
    });

    const newOrder = await orderservice.createOrder(data);
    return successResponse(res, "Create order success", newOrder, 201);
  } catch (error) {
    next(error);
  }
};

const countOrders = async (req, res, next) => {
  try {
    const count = await orderservice.countOrders();
    return successResponse(res, "Count orders success", count, StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};

const totalIncome = async (req, res, next) => {
  try {
    const income = await orderservice.totalIncome();
    return successResponse(res, "Total income success", income, StatusCodes.OK);
  } catch (error) {
    next(error);
  }
}

const cancelOrder = async (req, res, next) => {
  try {
    if (!req.params.id) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Cancel order failed",
        "Order ID is required"
      );
    }
    if (isNaN(parseInt(req.params.id))) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Cancel order failed",
        "Order ID must be a number"
      );
    }
    const orderId = parseInt(req.params.id);
    await orderservice.cancelOrder(orderId);
    return successResponse(res, "Cancel order success", null, StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  getOrdersByCustomer,
  createOrder,
  countOrders,
  totalIncome,
  cancelOrder,
  getStatistics,
};
