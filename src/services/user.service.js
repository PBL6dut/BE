const userRepository = require("../repositories/user.repository");

const { PrismaClient } = require("../generated/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const { default: ApiError } = require("../utils/ApiError");
const { StatusCodes } = require("http-status-codes");

const getAllCustomers = async (pageSize = 10, page = 1) => {
  const customers = await userRepository.getAllCustomers(pageSize, page);
  const currentPage = page < 1 ? 1 : page;
  const totalCustomers = await prisma.customer.count();
  const totalPages = Math.ceil(totalCustomers / pageSize);
  return { data: customers, pagination: { currentPage, totalPages } };
};

const getCurrentCustomer = async (id) => {
  const customer = await userRepository.getCustomerById(id);
  return customer;
}



const countCustomers = async () => {
  const count = await userRepository.countCustomers();
  return count;
};

// const getAllCustomers = async (pageSize=10, page=1) => {
//   const

//   if (!customers || customers.length === 0) {
//     throw new ApiError(StatusCodes.NOT_FOUND, "No customers found");
//   }

//   const currentPage = page < 1 ? 1 : page;
//   const totalCustomers = await prisma.customer.count();
//   const totalPages = Math.ceil(totalCustomers / pageSize);
//   return { data: customers, pagination: { currentPage, totalPages } };
// };

const getCustomerById = async (id) => {
  const customer = await userRepository.getCustomerById(id);

  if (!customer) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Customer not found");
  }

  return customer;
};

const updateCustomer = async (id, data) => {
  const idExisted = await checkCustomerId(id);
  if (!idExisted) {
    throw new ApiError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      "Update customer failed",
      "Customer ID does not exist"
    );
  }

  if (data.email) {
    const emailExisted = await userRepository.getCustomerByEmail(data.email);
    if (emailExisted) {
      throw new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        "Update customer failed",
        "Email already exists"
      );
    }
  }

  if (data.phone) {
    const phoneExisted = await userRepository.getCustomerByPhone(data.phone);
    if (phoneExisted) {
      throw new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        "Update customer failed",
        "Phone number already exists"
      );
    }
  }

  if (data.google_id) {
    const googleIdExisted = await userRepository.getCustomerByGoogleId(data.google_id);
    if (googleIdExisted) {
      throw new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        "Update customer failed",
        "Google ID already exists"
      );
    }
  }

  if (data.facebook_id) {
    const facebookIdExisted = await userRepository.getCustomerByFacebookId(data.facebook_id);
    if (facebookIdExisted) {
      throw new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        "Update customer failed",
        "Facebook ID already exists"
      );
    }
  }

  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  return await prisma.customer.update({
    where: { id },
    data,
    select: {
      id: true,
      full_name: true,
      email: true,
      phone: true,
      address: true,
    },
  });
};

const deleteCustomer = async (id) => {
  const idExisted = await checkCustomerId(id);
  if (!idExisted) {
    throw new ApiError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      "Delete customer failed",
      "Customer ID does not exist"
    );
  }

  return await prisma.$transaction(async (prisma) => {
    await prisma.order.deleteMany({
      where: { customer_id: id },
    });

    await prisma.customer.delete({
      where: { id },
    });
  });
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  countCustomers,
  getCurrentCustomer,
};
