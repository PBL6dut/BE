const { default: ApiError } = require("../../utils/ApiError");
const { StatusCodes } = require("http-status-codes");
const { schema } = require("../user/user.schema.validation");

const validateCreateCustomer = async (req, res, next) => {
  const data = req.body;
  try {
    if (!data) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Create customer failed", "No data provided");
    }
    await schema.validateAsync(data, { abortEarly: false });
    next();
  } catch (err) {
    // Nếu lỗi là từ Joi, tạo một ApiError tùy chỉnh
    if (err.isJoi) {
      const errorDetails = err.details.map((detail) => detail.message.replace(/\"/g, ""));
      const apiError = new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, "Validation failed", errorDetails);
      return next(apiError);
    }
    next(err);
  }
};

const validateUpdateCustomer = async (req, res, next) => {
  try {
    const data = req.body;
    if (!data) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "No data provided");
    }
    const dataKeys = Object.keys(data);
    const schemaKeys = Array.from(schema._ids._byKey.keys());
    const unavailableKeys = schemaKeys.filter((key) => !dataKeys.includes(key));
  
    const updateSchema = schema.fork(unavailableKeys, (field) =>
      field.optional()
    );

    await updateSchema.validateAsync(data, { abortEarly: false });
    next();
  } catch (err) {
    if (err.isJoi) {
      const errorDetails = err.details.map((detail) => detail.message.replace(/\"/g, ""));
      const apiError = new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, "Validation failed", errorDetails);
      return next(apiError);
    }
    next(err);
  }
};

module.exports = {
  validateCreateCustomer,
  validateUpdateCustomer,
};
