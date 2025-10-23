const Joi = require("joi");
const {
  checkCustomerEmail,
  checkCustomerPhone,
} = require("../models/user.model");
const { errorResponse } = require("../utils/response");

const customerSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).required(),
  email: Joi.string()
    .email()
    .required()
    .external(async (value, helpers) => {
      if (await checkCustomerEmail(value)) {
        return helpers.message("email already exists");
      }
      return value;
    }),
  password: Joi.string().min(3).required(),
  phone: Joi.string()
    .min(10)
    .max(11)
    .required()
    .external(async (value, helpers) => {
      if (await checkCustomerPhone(value)) {
        return helpers.message("phone number already exists");
      }
      return value;
    }),
  address: Joi.string().max(200),
});

const validateCreateCustomer = async (req, res, next) => {
  const data = req.body;
  if(!data){
    return errorResponse(res, "Validation failed", "No data provided", 400);
  }

  try {
    await customerSchema.validateAsync(data, { abortEarly: false });
    next();
  } catch (error) {
    console.log(error)
    return errorResponse(res, "Validation failed", error.details.map((err) => err.message.replace(/\"/g, "")), 400);
  }
};

const validateUpdateCustomer = async (req, res, next) => {
  const data = req.body;
  if(!data){
    return errorResponse(res, "Validation failed", "No data provided", 400);
  }
  const dataKeys = Object.keys(data);
  const schemaKeys = Array.from(customerSchema._ids._byKey.keys());
  const unavailableKeys = schemaKeys.filter((key) => !dataKeys.includes(key));

  const updateSchema = customerSchema.fork(unavailableKeys, (field) =>
    field.optional()
  );
  
  try {
    await updateSchema.validateAsync(data, { abortEarly: false });
    next();
  } catch (error) {
    return errorResponse(res, "Validation failed", error.details.map((err) => err.message.replace(/\"/g, "")), 400);
  }
};

module.exports = {
  validateCreateCustomer,
  validateUpdateCustomer,
};
