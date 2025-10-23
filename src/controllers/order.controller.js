const orderModel = require('../models/order.model')
const { successResponse, errorResponse } = require("../utils/response");
const { getProductById } = require('../models/product.model')

const getAllOrders = async (req, res) => {
    try {
        const orders = await orderModel.getAllOrders();
        if(!orders) {
            return errorResponse(res, "No orders found", null, 404);
        }
        return successResponse(res, "Get all orders success", orders);
    } catch (error) {
        return errorResponse(res, "Get all orders failed", error.message, 500);
    }
}

const getOrderById = async (req, res) => {
    const orderId = parseInt(req.params.id);
    const order = await orderModel.getOrderById(orderId);
    if (!order) {
        return errorResponse(res, "Order not found", null, 404);
    }
    return successResponse(res, "Get order success", order);
}

const getOrdersByCustomer = async (req, res) => {
    const customerId = parseInt(req.params.customerId);
    const orders = await orderModel.getOrdersByCustomer(customerId);
    if (!orders) {
        return errorResponse(res, "No orders found for this customer", null, 404);
    }
    return successResponse(res, "Get orders by customer success", orders);
}

const createOrder = async (req, res) => {
    const data = req.body;
    // Sửa lỗi: Gán lại giá trị đã được parse
    if (data.customer_id) {
        data.customer_id = parseInt(data.customer_id, 10);
    }
    data.order_details.forEach(item => {
        if (item.product_id) item.product_id = parseInt(item.product_id, 10);
        if (item.quantity) item.quantity = parseInt(item.quantity, 10);
    });
    
    try {
        const newOrder = await orderModel.createOrder(data);
        return successResponse(res, "Create order success", newOrder, 201);
    } catch (error) {
        return errorResponse(res, "Create order failed", error.message, 500);
    }
}

module.exports = {
    getAllOrders,
    getOrderById,
    getOrdersByCustomer,
    createOrder
}