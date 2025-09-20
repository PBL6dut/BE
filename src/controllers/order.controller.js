const orderModel = require('../models/order.model')

const getAllOrders = async (req, res) => {
    const orders = await orderModel.getAllOrders();
    res.json(orders);
}

const getOrderById = async (req, res) => {
    const orderId = parseInt(req.params.id);
    const order = await orderModel.getOrderById(orderId);
    res.json(order);
}

const getOrdersByCustomer = async (req, res) => {
    const customerId = parseInt(req.params.customerId);
    const orders = await orderModel.getOrdersByCustomer(customerId);
    res.json(orders);
}

module.exports = {
    getAllOrders,
    getOrderById,
    getOrdersByCustomer
}