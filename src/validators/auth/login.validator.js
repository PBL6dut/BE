const { StatusCodes } = require("http-status-codes");
const {default: ApiError} = require("../../utils/ApiError");
const Joi = require("joi");

const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required',
    }),
})

const validateLogin = async (req, res, next) => {
  const data = req.body;
    try {
    if (!data) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Login failed", "No data provided");
    }
    const { error } = schema.validate(data, { abortEarly: false });
    if (error) {
      const errorDetails = error.details.map((detail) => detail.message.replace(/\"/g, ""));
      throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, "Validation failed", errorDetails);
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  validateLogin,
};