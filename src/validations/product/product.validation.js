const { default: ApiError } = require("../../utils/ApiError");
const { StatusCodes } = require("http-status-codes");
const { schema } = require("./product.schema.validation");

const ValidateFiles = (files) => {
  const errors = [];
  console.log(files);
  if (files.length === 0) {
    errors.push("At least one image file is required");
  } else if (files.length > 5) {
    errors.push("You can upload a maximum of 5 images.");
  } else {
    // Kiểm tra định dạng của file avatar
    const allowedFormats = ["image/jpeg", "image/png", "image/gif"];
    files.forEach((file, index) => {
      if (!allowedFormats.includes(file.mimetype)) {
        errors.push(
          "Invalid image format. Only JPEG, PNG, and GIF are allowed."
        );
      }
    });

    const maxSize = 2048 * 1024; // 2MB
    files.forEach((file, index) => {
      if (file.size > maxSize) {
        errors.push("Image size exceeds the limit of 2MB.");
      }
    });
  }

  return errors;
};

const validateCreateProduct = (req, res, next) => {
  const data = req.body;
  const files = req.files || [];
  if (!data || !files) {
    return next(
      new ApiError(
        StatusCodes.BAD_REQUEST,
        "Create product failed",
        "No data provided"
      )
    );
  }

  const { error } = schema.validate(data, { abortEarly: false });
  const fileErrors = ValidateFiles(files);

  // Gộp lỗi
  const errors = [];
  if (error)
    errors.push(...error.details.map((err) => err.message.replace(/\"/g, "")));
  if (fileErrors.length > 0) errors.push(...fileErrors);

  if (errors.length > 0) {
    next(
      new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        "Validation failed",
        errors
      )
    );
  }
  next();
};

const validateUpdateProduct = (req, res, next) => {
  const data = req.body;
  const files =
    req.files && req.files["image_url"] ? req.files["image_url"] : [];

  const errors = [];
  if (data) {
    const dataKeys = Object.keys(data);
    const schemaKeys = Array.from(schema._ids._byKey.keys());
    const unavailableKeys = schemaKeys.filter((key) => !dataKeys.includes(key));

    const updateSchema = schema.fork(unavailableKeys, (field) =>
      field.optional()
    );

    const { error } = updateSchema.validate(data, { abortEarly: false });
    if (error) errors.push(...error.details.map((err) => err.message));
  }

  if (files.length > 0) {
    const fileErrors = ValidateFiles(files);
    if (fileErrors.length > 0) errors.push(...fileErrors);
  }

  if (errors.length > 0) {
    const apiError = new ApiError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      "Validation failed",
      errors
    );
    return next(apiError);
  }
  next();
};

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
};
