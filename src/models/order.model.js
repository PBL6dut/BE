const { PrismaClient } = require('../generated/client')
const prisma = new PrismaClient()
const { getProductById } = require('./product.model')

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

const createOrder = async (orderData) => {
    const { order_details, ...data } = orderData;

    // Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
    return await prisma.$transaction(async (tx) => {
        const productIds = order_details.map(item => item.product_id);
        
        // Lấy thông tin sản phẩm từ DB để tính tổng tiền và kiểm tra
        const products = await tx.product.findMany({
            where: {
              id: { in: productIds }
            }
        });

        let totalAmount = 0;
        const orderDetailsData = order_details.map(item => {
            const product = products.find(p => p.id === item.product_id);
            if (!product) {
                throw new Error(`Sản phẩm với ID ${item.product_id} không tồn tại.`);
            }
            if (product.stock_quantity < item.quantity) {
                throw new Error(`Sản phẩm "${product.name}" không đủ số lượng tồn kho.`);
            }
            
            // Sửa lỗi: Lấy giá từ `sale_price` hoặc `price` của sản phẩm
            const unitPrice = product.sale_price || product.price;
            const totalPrice = unitPrice * item.quantity;
            totalAmount += totalPrice;
            return {
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: unitPrice,
                total_price: totalPrice
            };
        });

        // Cập nhật số lượng tồn kho của sản phẩm
        for (const item of order_details) {
            await tx.product.update({
                where: { id: item.product_id },
                data: { stock_quantity: { decrement: item.quantity } }
            });
        }

        // Tạo Order và OrderDetail
        return await tx.order.create({
            data: {
                ...data,
                order_number: `ORD-${Date.now()}`, // Thêm mã đơn hàng duy nhất
                total_amount: totalAmount,
                order_details: {
                    create: orderDetailsData
                }
            },
            include: {
                order_details: true
            }
        });
    });
}

module.exports = {
    getAllOrders,
    getOrderById,
    getOrdersByCustomer,
    createOrder
}