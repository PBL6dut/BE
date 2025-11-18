const Joi = require("joi");
const { default: ApiError } = require("../../utils/ApiError");
const { StatusCodes } = require("http-status-codes");

const getProductsSchema = {
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(50).optional(),
  name: Joi.string().optional(),
  min_price: Joi.number().optional().min(0),
  max_price: Joi.number().optional().min(0),
  tags: Joi.string().optional(),
  sort: Joi.string().optional(),
  category_id: Joi.number().integer().optional(),
};

const validateGetProducts = (req, res, next) => {
  const { error } = Joi.object(getProductsSchema).validate(req.query, {
    abortEarly: false,
  });
  const errors = [];
  if (error) errors.push(...error.details.map((err) => err.message.replace(/\"/g, "")));
  if (errors.length > 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Get Products failed",
      errors
    );
  }
  next();
};

module.exports = {
  validateGetProducts,
};
