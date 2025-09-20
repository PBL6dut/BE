const Joi = require("joi");
const {
  checkCustomerEmail,
  checkCustomerPhone,
} = require("../models/user.model");

const customerSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).required(),
  email: Joi.string()
    .email()
    .required()
    .custom((value, helpers) => {
      if (checkCustomerEmail(value)) {
        return helpers.error("email already exists");
      }
      return value;
    }),
  password: Joi.string().min(3).required(),
  phone: Joi.string()
    .min(10)
    .max(11)
    .custom((value, helpers) => {
      if (checkCustomerPhone(value)) {
        return helpers.error("phone number already exists");
      }
    }),
  address: Joi.string().max(200),
});

const validateCreateCustomer = (req, res, next) => {
  const { data } = req.body;

  const { errors } = customerSchema.validate(data, { abortEarly: false });
  if (errors) {
    return res.status(400).json({ errors: errors.map((err) => err.message) });
  }
  
  next();
};

const validateUpdateCustomer = (req, res, next) => {
  const { data } = req.body;

  const dataKeys = Object.keys(data);
  const schemaKeys = Array.from(customerSchema._ids._byKey.keys());
  const unavailableKeys = schemaKeys.filter((key) => !dataKeys.includes(key));

  const updateSchema = customerSchema.fork(unavailableKeys, (field) =>
    field.optional()
  );

  const { errors } = updateSchema.validate(data, { abortEarly: false });
  if (errors) {
    return res.status(400).json({ errors: errors.map((err) => err.message) });
  }

  next();
};

module.exports = {
  validateCreateCustomer,
  validateUpdateCustomer,
};
