const prisma = require("../utils/prisma-client");
const { default: ApiError } = require("../utils/ApiError");

const countOrders = async () => {
  const count = await prisma.order.count();
  return count;
};

const getTotalIncome = async () => {
  const income = await prisma.order.aggregate({
    _sum: {
      total_amount: true,
    },
    where: {
      payment_status: "paid",
    },
  });
  return income._sum.total_amount || 0;
};

const getAllOrders = async (page = 1, pageSize = 10) => {
  const orders = await prisma.order.findMany({
    include: {
      order_details: {
        include: {
          product: {
            select: { id: true, name: true, images: { select: { url: true } } },
          },
        },
      },
      customer: true,
    },
    take: pageSize,
    skip: (page - 1) * pageSize,
  });
  const count = await countOrders();
  return { orders, count };
};

const getOrderById = async (id) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      order_details: true,
    },
  });
  return order;
};

const getOrdersByCustomer = async (customer_id) => {
  const orders = await prisma.order.findMany({
    where: { customer_id },
    include: {
      order_details: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              images: { select: { url: true } },
            },
          },
        },
      },
    },
  });
  return orders;
};

const cancelOrder = async (id) => {
  const order = await prisma.order.findUnique({
    where: { id },
  });
  if (!order) {
    throw new ApiError(404, "Cancel order failed", "Order not found");
  }

  if (order.status !== "pending") {
    throw new ApiError(400, "Cancel order failed", "Only pending orders can be canceled");
  }
  return await prisma.order.update({
    where: { id },
    data: { status: "cancelled" },
  });
}

const countPendingOrders = async () => {
  const count = await prisma.order.count({
    where: { status: "pending" },
  });
  return count;
};

const countShippingOrders = async () => {
  const count = await prisma.order.count({
    where: { status: "shipping" },
  });
  return count;
};

const countCompletedOrders = async () => {
  const count = await prisma.order.count({
    where: { status: "completed" },
  });
  return count;
};

const countCancelledOrders = async () => {
  const count = await prisma.order.count({
    where: { status: "cancelled" },
  });
  return count;
}

const countConfirmedOrders = async () => {
  const count = await prisma.order.count({
    where: { status: "confirmed" },
  });
  return count;
};

module.exports = {
  getAllOrders,
  countOrders,
  getTotalIncome,
  getOrderById,
  getOrdersByCustomer,
  cancelOrder,
  countPendingOrders,
  countShippingOrders,
  countCompletedOrders,
  countCancelledOrders,
  countConfirmedOrders,
};
