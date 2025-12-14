const userRepository = require("../repositories/user.repository");
const bcrypt = require("bcrypt");
const { default: ApiError } = require("../utils/ApiError");
const { StatusCodes } = require("http-status-codes");

const adminLogin = async (email, password) => {
  const existingAdmin = await userRepository.getAdminByEmail(email);
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

const createAdmin = async (data) => {
  const emailExisted = await userRepository.getAdminByEmail(data.email);
  if (emailExisted) {
    throw new ApiError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      "Create admin failed",
      "Email already exists"
    );
  }

  const usernameExisted = await userRepository.getAdminByUsername(data.username);
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

const customerLogin = async (email, password) => {
  const existingCustomer = await userRepository.getCustomerByEmail(email);

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
    const emailExisted = await userRepository.getCustomerByEmail(data.email);
    if (emailExisted) {
      throw new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        "Create customer failed",
        "Email already exists"
      );
    }
  }

  if (data.google_id) {
    const googleIdExisted = await userRepository.getCustomerByGoogleId(data.google_id);
    if (googleIdExisted) {
      throw new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        "Create customer failed",
        "Google ID already exists"
      );
    }
  }

  if (data.facebook_id) {
    const facebookIdExisted = await userRepository.getCustomerByFacebookId(data.facebook_id);
    if (facebookIdExisted) {
      throw new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        "Create customer failed",
        "Facebook ID already exists"
      );
    }
  }

  const phoneExisted = await userRepository.getCustomerByPhone(data.phone);
  if (phoneExisted) {
    throw new ApiError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      "Create customer failed",
      "Phone number already exists"
    );
  }

  data.password = await bcrypt.hash(data.password, 10);

  const newCustomer = await userRepository.createCustomer(data);
  delete newCustomer.password;
  return newCustomer;
};

module.exports = { adminLogin, createCustomer, createAdmin, customerLogin };