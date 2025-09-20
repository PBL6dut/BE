const { PrismaClient } = require('../generated/client')
const prisma = new PrismaClient()
const bcrypt = require('bcrypt')

const checkAdminEmail = async (email) => {
    const admin = await prisma.admin.findUnique({
        where: { email }
    })
    return !!admin; // Trả về true nếu tồn tại, false nếu không tồn tại
}

const checkAdminUsername = async (username) => {
    const admin = await prisma.admin.findUnique({
        where: { username }
    })
    return !!admin; // Trả về true nếu tồn tại, false nếu không tồn tại
}

const createAdmin = async (data) => {
    return prisma.admin.create({
        data
    })
}

const adminLogin = async (email, password) => {
    const existingAdmin = await prisma.admin.findUnique({
        where: { email }
    })
    if (!existingAdmin) {
        return false; // Email không tồn tại
    }

    const passwordMatch = existingAdmin && await bcrypt.compare(password, existingAdmin.password)
    const passwordHash = await bcrypt.hash(password, 10)
    console.log(passwordHash)
    if (!passwordMatch) {
        return false; // Mật khẩu không đúng
    }
    return existingAdmin;
}

const checkCustomerEmail = async (email) => {
    const customer = await prisma.customer.findUnique({
        where: { email }
    })
    return !!customer; // Trả về true nếu tồn tại, false nếu không tồn tại
}

const checkCustomerPhone = async (phone) => {
    const customer = await prisma.customer.findUnique({
        where: { phone }
    })
    return !!customer; // Trả về true nếu tồn tại, false nếu không tồn tại
}

const customerLogin = async (email, password) => {
    const existingCustomer = await prisma.customer.findUnique({
        where: { email }
    })

    if (!existingCustomer) {
        return false; // Email không tồn tại
    }

    const passwordMatch = existingCustomer && await bcrypt.compare(password, existingCustomer.password)
    if (!passwordMatch) {
        return false; // Mật khẩu không đúng
    }

    return existingCustomer;
}

const getAllCustomers = async () => {
    return customers = prisma.customer.findMany({
        include: {
            orders: true
        }
    })
}

const getCustomerById = async (id) => {
    return prisma.customer.findUnique({
        where: { id },
        include: {
            orders: true
        }
    })
}


const createCustomer = async (data) => {
    return prisma.customer.create({
        data
    })
}

const updateCustomer = async (id, data) => {
    return prisma.customer.update({
        where: { id },
        data
    })
}

const deleteCustomer = async (id) => {
    return prisma.customer.delete({
        where: { id }
    })
}

module.exports = {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    checkCustomerEmail,
    checkCustomerPhone,
    customerLogin,
    adminLogin,
    checkAdminEmail,
    checkAdminUsername,
    createAdmin
}