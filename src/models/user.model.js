const { PrismaClient } = require("../generated/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const { default: ApiError } = require("../utils/ApiError");
const { StatusCodes } = require("http-status-codes");

const checkAdminEmail = async (email) => {
  const admin = await prisma.admin.findUnique({
    where: { email },
  });
  return !!admin; // Trả về true nếu tồn tại, false nếu không tồn tại
};

const checkAdminUsername = async (username) => {
  const admin = await prisma.admin.findUnique({
    where: { username },
  });
  return !!admin; // Trả về true nếu tồn tại, false nếu không tồn tại
};

const createAdmin = async (data) => {
  const emailExisted = await checkAdminEmail(data.email);
  if (emailExisted) {
    throw new ApiError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      "Create admin failed",
      "Email already exists"
    );
  }

  const usernameExisted = await checkAdminUsername(data.username);
  if (usernameExisted) {
    throw new ApiError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      "Create admin failed",
      "Username already exists"
    );
  }

  data.password = await bcrypt.hash(data.password, 10);

  return await prisma.admin.create({
    data,
  });
};

const adminLogin = async (email, password) => {
  const existingAdmin = await prisma.admin.findUnique({
    where: { email },
    include: {
      created_at: false,
      // updated_at: false
    },
  });
  if (!existingAdmin) {
    throw new ApiError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      "Login failed",
      "Email does not exist"
    );
  }

  const passwordMatch =
    existingAdmin && (await bcrypt.compare(password, existingAdmin.password));
  if (!passwordMatch) {
    throw new ApiError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      "Login failed",
      "Invalid password"
    );
  }

  delete existingAdmin.password;
  return existingAdmin;
};

const checkCustomerEmail = async (email) => {
  const customer = await prisma.customer.findUnique({
    where: { email },
  });
  return !!customer; // Trả về true nếu tồn tại, false nếu không tồn tại
};

const checkCustomerPhone = async (phone) => {
  const customer = await prisma.customer.findUnique({
    where: { phone },
  });
  return !!customer; // Trả về true nếu tồn tại, false nếu không tồn tại
};

const checkCustomerId = async (id) => {
  const customer = await prisma.customer.findUnique({
    where: { id },
  });
  return !!customer;
};

const customerLogin = async (email, password) => {
  const existingCustomer = await prisma.customer.findUnique({
    where: { email },
    select: {
      id: true,
      full_name: true,
      email: true,
      phone: true,
      address: true,
      password: true,
    },
  });

  if (!existingCustomer) {
    throw new ApiError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      "Login failed",
      "Email does not exist"
    );
  }

  const passwordMatch =
    existingCustomer &&
    (await bcrypt.compare(password, existingCustomer.password));
  if (!passwordMatch) {
    throw new ApiError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      "Login failed",
      "Invalid password"
    );
  }

  delete existingCustomer.password;
  return existingCustomer;
};

const getAllCustomers = async () => {
  const customers = await prisma.customer.findMany({
    include: {
      orders: true,
    },
  });

  if (!customers || customers.length === 0) {
    throw new ApiError(StatusCodes.NOT_FOUND, "No customers found");
  }

  return customers;
};

const getCustomerById = async (id) => {
  const customer = await prisma.customer.findUnique({
    where: { id },
    select: {
      id: true,
      full_name: true,
      email: true,
      phone: true,
      address: true,
    }
  });

  if (!customer) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Customer not found");
  }

  return customer;
};

const createCustomer = async (data) => {
  if (!data.email && !data.google_id && !data.facebook_id) {
    throw new ApiError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      "Create customer failed",
      "At least one of email, google_id, or facebook_id must be provided"
    );
  }

  if (data.email) {
    console.log(data.email);
    const emailExisted = await checkCustomerEmail(data.email);
    if (emailExisted) {
      throw new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        "Create customer failed",
        "Email already exists"
      );
    }
  }

  if (data.google_id) {
    const googleIdExisted = await prisma.customer.findUnique({
      where: { google_id: data.google_id },
    });
    if (googleIdExisted) {
      throw new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        "Create customer failed",
        "Google ID already exists"
      );
    }
  }

  if (data.facebook_id) {
    const facebookIdExisted = await prisma.customer.findUnique({
      where: { facebook_id: data.facebook_id },
    });
    if (facebookIdExisted) {
      throw new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        "Create customer failed",
        "Facebook ID already exists"
      );
    }
  }

  const phoneExisted = await checkCustomerPhone(data.phone);
  if (phoneExisted) {
    throw new ApiError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      "Create customer failed",
      "Phone number already exists"
    );
  }

  data.password = await bcrypt.hash(data.password, 10);

  const newCustomer = await prisma.customer.create({
    data,
  });
  delete newCustomer.password;
  return newCustomer;
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
    const emailExisted = await checkCustomerEmail(data.email);
    if (emailExisted) {
      throw new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        "Update customer failed",
        "Email already exists"
      );
    }
  }

  if (data.phone) {
    const phoneExisted = await checkCustomerPhone(data.phone);
    if (phoneExisted) {
      throw new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        "Update customer failed",
        "Phone number already exists"
      );
    }
  }

  if (data.google_id) {
    const googleIdExisted = await prisma.customer.findUnique({
      where: { google_id: data.google_id },
    });
    if (googleIdExisted) {
      throw new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        "Update customer failed",
        "Google ID already exists"
      );
    }
  }

  if (data.facebook_id) {
    const facebookIdExisted = await prisma.customer.findUnique({
      where: { facebook_id: data.facebook_id },
    });
    if (facebookIdExisted) {
      throw new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        "Update customer failed",
        "Facebook ID already exists"
      );
    }
  }

  if(data.password){
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
      address: true
    }
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
  createCustomer,
  updateCustomer,
  deleteCustomer,
  checkCustomerEmail,
  checkCustomerPhone,
  checkCustomerId,
  customerLogin,
  adminLogin,
  checkAdminEmail,
  checkAdminUsername,
  createAdmin,
};
