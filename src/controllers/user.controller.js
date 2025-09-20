const userModel = require("../models/user.model");
const validateUser = require("../validations/user.validation");
const bcrypt = require("bcrypt");

const checkCustomerAuth = (req, customerId) => {
  const { id } = req.user;
  return id === customerId;
};

const getAllCustomers = async (req, res) => {
  const customers = await userModel.getAllCustomers();
  res.json(customers);
};

const getCustomerById = async (req, res) => {
  const customerId = parseInt(req.params.id);
  const { role } = req.user;
  if (role !== "admin" && !checkCustomerAuth(req, customerId)) {
    return res.status(403).json({ error: "Forbidden: Access is denied" });
  }
  const customer = await userModel.getCustomerById(customerId);
  res.json(customer);
};

const createCustomer = async (req, res) => {
  const customerData = req.body;

  const errors = validateUser(customerData);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  const emailExists = await userModel.checkCustomerEmail(customerData.email);
  if (emailExists) {
    return res.status(400).json({ errors: { email: "Email already exists" } });
  }

  const newCustomer = await userModel.createCustomer(customerData);
  res.json(newCustomer);
};

const updateCustomer = async (req, res) => {
  const customerId = parseInt(req.params.id);
  const { role } = req.user;
  if (role !== "admin" && !checkCustomerAuth(req, customerId)) {
    return res.status(403).json({ error: "Forbidden: Access is denied" });
  }

  const customerData = req.body;

  const emailExists = await userModel.checkCustomerEmail(customerData.email);
  if (emailExists) {
    return res.status(400).json({ errors: { email: "Email already exists" } });
  }

  const updatedCustomer = await userModel.updateCustomer(
    customerId,
    customerData
  );
  res.json(updatedCustomer);
};

const deleteCustomer = async (req, res) => {
  const customerId = parseInt(req.params.id);
  const { role } = req.user;

  if (role !== "admin" && !checkCustomerAuth(req, customerId)) {
    return res.status(403).json({ error: "Forbidden: Access is denied" });
  }

  await userModel.deleteCustomer(customerId);
  res.json({ message: "Customer deleted successfully" });
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
