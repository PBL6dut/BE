const prisma = require("../utils/prisma-client.js");

const countCustomers = async () => {
  const count = await prisma.customer.count();
  return count;
};

const getAllCustomers = async (pageSize = 10, page = 1) => {
  const customers = await prisma.customer.findMany({
    include: {
      orders: true,
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  const count = await countCustomers();
  return { customers, count };
};

const getCustomerById = async (id) => {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: true,
      password: false,
    },
  });
  return customer;
};

const getCustomerByPhone = async (phone) => {
  const customer = await prisma.customer.findUnique({
    where: { phone },
  });
  return customer;
}

const getCustomerByEmail = async (email) => {
  const customer = await prisma.customer.findUnique({
    where: { email },
  });
  return customer;
}

const getCustomerByFacebookId = async (facebook_id) => {
  const customer = await prisma.customer.findUnique({
    where: { facebook_id },
  });
  return customer;
};

const getCustomerByGoogleId = async (google_id) => {
  const customer = await prisma.customer.findUnique({
    where: { google_id },
  });
  return customer;
};

const createCustomer = async (data) => {
  const newCustomer = await prisma.customer.create({
    data,
  });
  return newCustomer;
};

const updateCustomer = async (id, data) => {
  const updatedCustomer = await prisma.customer.update({
    where: { id },
    data,
  });
  return updatedCustomer;
};

const getAdminByEmail = async (email) => {
  const admin = await prisma.admin.findUnique({
    where: { email },
  });
  return admin;
}

const getAdminByUsername = async (username) => {
  const admin = await prisma.admin.findUnique({
    where: { username },
  });
  return admin;
}

module.exports = {
  getAllCustomers,
  countCustomers,
  getCustomerById,
  getCustomerByPhone,
  getCustomerByEmail,
  getCustomerByFacebookId,
  getCustomerByGoogleId,
  createCustomer,
  updateCustomer,
  getAdminByEmail,
  getAdminByUsername,
};
