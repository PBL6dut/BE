const { StatusCodes } = require("http-status-codes");
const { PrismaClient } = require("../generated/client");
const { default: ApiError } = require("../utils/ApiError");
const prisma = new PrismaClient();
const { getProductById } = require("./product.service");
const formatImageUrl = require("../utils/formatImageUrl");
const {
  calculateShippingFee,
  getExpectedDeliveryDate,
} = require("./payment.service");
const SEPAY_QR_CODE_URL = process.env.SEPAY_QR_CODE_URL;
const ACCOUNT_NUMBER = process.env.SEPAY_ACCOUNT_NUMBER;
const GATEWAY_BANK = process.env.SEPAY_GATEWAY_BANK;
const orderRepository = require("../repositories/order.repository");
const productRepository = require("../repositories/product.repository");

const countOrders = async () => {
  const count = await orderRepository.countOrders();
  return count;
};

const totalIncome = async () => {
  const income = await orderRepository.getTotalIncome();
  return income;
};

const getStatistics = async () => {
  const pendingOrders = await orderRepository.countPendingOrders();
  const shippingOrders = await orderRepository.countShippingOrders();
  const completedOrders = await orderRepository.countCompletedOrders();
  const cancelledOrders = await orderRepository.countCancelledOrders();
  const confirmedOrders = await orderRepository.countConfirmedOrders();
  const totalOrders = await countOrders();
  return {
    pendingOrders,
    shippingOrders,
    completedOrders,
    cancelledOrders,
    confirmedOrders,
    totalOrders,
  };
};

const getAllOrders = async (page = 1, pageSize = 10) => {
  const currentPage = page < 1 ? 1 : page;

  const result = await orderRepository.getAllOrders(currentPage, pageSize);
  const { orders, count } = result;
  const totalPages = Math.ceil(count / pageSize);
  return {
    data: orders,
    pagination: { currentPage, totalPages },
  };
};

const getOrderById = async (id) => {
  const order = await orderRepository.getOrderById(id);

  if (!order) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "Order not found",
      `Đơn hàng với ID ${id} không tồn tại`
    );
  }

  return order;
};

const getOrdersByCustomer = async (customer_id) => {
  const orders = await orderRepository.getOrdersByCustomer(customer_id);

  if (orders.length !== 0) {
    orders.forEach(async (order) => {
      delete order.created_at;
      delete order.updated_at;
    });
  }

  return orders;
};

const createOrder = async (orderData) => {
  const { order_details, to_district_id, to_ward_code, ...data } = orderData;
  console.log(order_details);

  // --- BƯỚC 1: LẤY THÔNG TIN SẢN PHẨM VÀ TÍNH TOÁN SƠ BỘ ---
  const productIds = order_details.map((item) => item.product_id);
  const products = await productRepository.getProductsByIds(productIds);
  console.log(products);

  let subTotal = 0;
  let totalWeight = 0;
  let maxHeight = 0;
  let maxLength = 0;
  let maxWidth = 0;

  order_details.forEach((item) => {
    const product = products.find((p) => p.id === item.product_id);
    if (!product) {
      throw new Error(`Sản phẩm với ID ${item.product_id} không tồn tại.`);
    }
    if (product.stock_quantity < item.quantity) {
      throw new Error(`Sản phẩm "${product.name}" không đủ số lượng tồn kho.`);
    }

    const unitPrice = product.price || product.sale_price;
    subTotal += unitPrice * item.quantity;

    if (product.weight) {
      totalWeight += parseFloat(product.weight) * item.quantity;
    }
    if (product.height && parseFloat(product.height) > maxHeight) {
      maxHeight = parseFloat(product.height);
    }
    if (product.length && parseFloat(product.length) > maxLength) {
      maxLength = parseFloat(product.length);
    }
    if (product.width && parseFloat(product.width) > maxWidth) {
      maxWidth = parseFloat(product.width);
    }
  });

  const height = maxHeight || 1;
  const length = maxLength || 1;
  const width = maxWidth || 1;
  const weight = totalWeight || 1;

  // --- BƯỚC 2: GỌI API BÊN NGOÀI (TRƯỚC KHI VÀO TRANSACTION) ---
  const shippingFee = await calculateShippingFee(
    subTotal,
    to_district_id,
    to_ward_code,
    height,
    length,
    width,
    weight
  );

  const expectedDeliveryDate = await getExpectedDeliveryDate(
    to_district_id,
    to_ward_code
  );

  // --- BƯỚC 3: TÍNH TỔNG TIỀN CUỐI CÙNG ---
  const totalAmount = subTotal + shippingFee;

  // --- BƯỚC 4: THỰC HIỆN CÁC THAO TÁC DB TRONG TRANSACTION ---
  // Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
  return await prisma.$transaction(async (tx) => {
    // Lấy lại thông tin sản phẩm bên trong transaction để kiểm tra lại lần cuối (lock)
    const productsInTx = await tx.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        stock_quantity: true,
        name: true,
        price: true,
        sale_price: true,
      },
    });

    // Tạo map để dễ truy cập
    const productMap = new Map(productsInTx.map((p) => [p.id, p]));

    const orderDetailsData = order_details.map((item) => {
      const product = productMap.get(item.product_id);
      if (!product) {
        throw new Error(`Sản phẩm với ID ${item.product_id} không tồn tại.`);
      }
      if (product.stock_quantity < item.quantity) {
        throw new Error(
          `Sản phẩm "${product.name}" không đủ số lượng tồn kho.`
        );
      }

      const unitPrice = product.price || product.sale_price;
      const totalPrice = unitPrice * item.quantity;

      return {
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
      };
    });

    // --- CẬP NHẬT TỒN KHO ---
    // Cập nhật số lượng tồn kho của sản phẩm
    for (const item of order_details) {
      await tx.product.update({
        where: { id: item.product_id },
        data: { stock_quantity: { decrement: item.quantity } },
      });
    }

    // --- TẠO ĐƠN HÀNG ---
    // Tạo Order và OrderDetail
    const newOrder = await tx.order.create({
      data: {
        ...data,
        order_number: `ORD${Date.now()}`, // Thêm mã đơn hàng duy nhất
        total_amount: totalAmount,
        shipping_fee: shippingFee,
        expected_delivery_date: expectedDeliveryDate,
        payment_method: "bank_transfer",
        order_details: {
          create: orderDetailsData,
        },
      },
      include: {
        order_details: true,
      },
    });
    const paymentInfo = {
      qr_code_url: `${SEPAY_QR_CODE_URL}&amount=${totalAmount}&des=${newOrder.order_number}`,
      account_number: ACCOUNT_NUMBER,
      gateway_bank: GATEWAY_BANK,
      content: newOrder.order_number,
    };
    newOrder.expected_delivery_date = expectedDeliveryDate.toLocaleDateString();
    return { ...newOrder, paymentInfo };
  });
};

const updateOrderStatusAfterPayment = async (orderNumber, amount) => {
  // Sử dụng transaction để đảm bảo tính nhất quán
  return await prisma.$transaction(async (tx) => {
    // 1. Tìm đơn hàng bằng order_number
    const order = await tx.order.findUnique({
      where: {
        order_number: orderNumber,
      },
    });

    // Nếu không tìm thấy đơn hàng, báo lỗi
    if (!order) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Payment failed",
        `Order with number ${orderNumber} not found.`
      );
    }

    // 2. Kiểm tra xem đơn hàng đã được thanh toán chưa
    if (order.payment_status === "paid") {
      // Nếu đã thanh toán, không làm gì cả và trả về thành công
      console.log(`Order ${orderNumber} has already been paid.`);
      return order;
    }

    // 3. So sánh số tiền chuyển khoản và tổng tiền đơn hàng
    if (parseInt(order.total_amount) !== parseInt(amount)) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Payment failed",
        `Incorrect payment amount for order ${orderNumber}. Expected ${order.total_amount}, but received ${amount}.`
      );
    }

    if (order.payment_method !== "bank_transfer") {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Payment failed",
        `Order ${orderNumber} does not use bank transfer as payment method.`
      );
    }

    // 4. Cập nhật trạng thái thanh toán và trạng thái đơn hàng
    return await tx.order.update({
      where: { id: order.id },
      data: {
        payment_status: "paid", // 'pending' -> 'paid'
      },
    });
  });
};

const cancelOrder = async (id) => {
  return await orderRepository.cancelOrder(id);
}

module.exports = {
  getAllOrders,
  getOrderById,
  getOrdersByCustomer,
  createOrder,
  updateOrderStatusAfterPayment,
  countOrders,
  totalIncome,
  cancelOrder,
  getStatistics,
};
