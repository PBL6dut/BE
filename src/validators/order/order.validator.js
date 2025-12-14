const Joi = require("joi");
const { errorResponse } = require("../../utils/response");
const { default: ApiError } = require("../../utils/ApiError");
const { StatusCodes } = require("http-status-codes");
const { schema } = require("./order.schema.validator");

const validateCreateOrder = async (req, res, next) => {
  try {
    const data = req.body;
    if (!data) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "No data provided");
    }

    await schema.validateAsync(data, { abortEarly: false });
  } catch (err) {
    if (err.isJoi) {
      const errorDetails = err.details.map((detail) =>
        detail.message.replace(/["]/g, "")
      );
      const apiError = new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        "validation failed",
        errorDetails
      );
      return next(apiError);
    }
    return next(err);
  }

  next();
};

module.exports = {
  validateCreateOrder,
};
