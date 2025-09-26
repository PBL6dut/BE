const { PrismaClient } = require('../generated/client')
const prisma = new PrismaClient()

const getAllOrders = async () => {
    return await prisma.order.findMany({
        include: {
            order_details: true,
            customer: true
        }
    })
}

const getOrderById = async (id) => {
    return await prisma.order.findUnique({
        where: { id },
        include: {
            order_details: true
        }
    })
}

const getOrdersByCustomer = async (customer_id) => {
    return await prisma.order.findMany({
        where: { customer_id },
        include: {
            order_details: true
        }
    })
}

module.exports = {
    getAllOrders,
    getOrderById,
    getOrdersByCustomer
}