const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;
const CUSTOMER_SECRET_KEY = process.env.CUSTOMER_SECRET_KEY;
const validateUser = require("../validations/user.validation");
const bcrypt = require("bcrypt");

const createAdminToken = (admin) => {
  const token = jwt.sign(
    { id: admin.id, email: admin.email, role: "admin" },
    ADMIN_SECRET_KEY,
    {
      expiresIn: "1h",
    }
  );
  return token;
};

const createCustomerToken = (customer) => {
  const token = jwt.sign(
    { id: customer.id, email: customer.email, role: "customer" },
    CUSTOMER_SECRET_KEY,
    {
      expiresIn: "1h",
    }
  );
  return token;
};

const verifyAdminToken = (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }
  try {
    const decoded = jwt.verify(token, ADMIN_SECRET_KEY);
    if (decoded) {
      return res.status(200).json({ valid: true, admin: decoded });
    } else {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
  } catch (error) {
    console.error("Error during token verification:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

const adminLogin = async (req, res) => {
  const data = req.body;
  console.log(data);
  const { email, password } = data;

  const existingAdmin = await userModel.adminLogin(email, password);
  if (!existingAdmin) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = createAdminToken(existingAdmin);
  res
    .status(200)
    .json({ message: "Login successful", admin: existingAdmin, token });
};

const createAdmin = async (req, res) => {
  const data = req.body;
  const errors = await validateUser.validateAdmin(data);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }
  data.password = await bcrypt.hash(data.password, 10);
  const newAdmin = await userModel.createAdmin(data);
  res.json(newAdmin);
};

const verifyCustomerToken = (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }
  try {
    const decoded = jwt.verify(token, CUSTOMER_SECRET_KEY);
    if (decoded) {
      return res.status(200).json({ valid: true, customer: decoded });
    } else {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
  } catch (error) {
    console.error("Error during token verification:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}

const customerLogin = async (req, res) => {
  const data = req.body;
  const { email, password } = data;

  const existingCustomer = await userModel.customerLogin(email, password);
  if (!existingCustomer) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  const token = createCustomerToken(existingCustomer);
  res
    .status(200)
    .json({ message: "Login successful", customer: existingCustomer, token });
};

const createCustomer = async (req, res) => {
  const data = req.body;
  const errors = await validateUser.validateCustomer(data);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }
  data.password = await bcrypt.hash(data.password, 10);
  const newCustomer = await userModel.createCustomer(data);
  res.status(201).json(newCustomer);
};

module.exports = {
  adminLogin,
  createAdmin,
  customerLogin,
  createCustomer,
  verifyAdminToken,
  verifyCustomerToken
};
