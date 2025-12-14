const Joi = require("joi");
const {default: ApiError} = require("../utils/ApiError");
const { StatusCodes } = require("http-status-codes");

const schema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(100).optional(),
});

const validatePaginationQuery = (req, res, next) => {
  try {
    const { page, pageSize } = req.query;
    const { error } = schema.validate({ page, pageSize }, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((err) => err.message.replace(/\"/g, ""));
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Pagination query validation failed",
        errors
      );
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validatePaginationQuery,
};
