const Joi = require("joi");
const { errorResponse } = require("../utils/response");

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
        errors.push("Invalid image format. Only JPEG, PNG, and GIF are allowed.");
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

const schema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).optional(),
  price: Joi.number().positive().required(),
  sale_price: Joi.number().positive().optional(),
  category_id: Joi.number().integer().required(),
  stock_quantity: Joi.number().integer().min(0).required(),
  material: Joi.string().max(100).optional(),
  color: Joi.string().max(50).optional(),
  height: Joi.number().positive().optional(),
  width: Joi.number().positive().optional(),
  length: Joi.number().positive().optional(),
  weight: Joi.number().positive().optional(),
  image_url: Joi.any().optional()
});

const validateCreateProduct = (req, res, next) => {
  const data = req.body;
  const files = req.files && req.files["image_url"] ? req.files["image_url"] : [];
  if (!data || !files) {
    return errorResponse(res, "Validation failed", "No data provided", 400);
  }

  const { error } = schema.validate(data, { abortEarly: false });
  const fileErrors = ValidateFiles(files);

  // Gộp lỗi
  const errors = [];
  if (error) errors.push(...error.details.map((err) => err.message.replace(/\"/g, "")));
  if (fileErrors.length > 0) errors.push(...fileErrors);

  if (errors.length > 0) {
    return errorResponse(res, "Validation failed", errors, 400);
  }
  next();
};

const validateUpdateProduct = (req, res, next) => {
  const data = req.body;
  const files = req.files && req.files["image_url"] ? req.files["image_url"] : [];

  const dataKeys = Object.keys(data);
  const schemaKeys = Array.from(schema._ids._byKey.keys());
  const unavailableKeys = schemaKeys.filter((key) => !dataKeys.includes(key));

  const updateSchema = schema.fork(unavailableKeys, (field) => field.optional());

  const { error } = updateSchema.validate(data, { abortEarly: false });

  const errors = [];
  if (error) errors.push(...error.details.map((err) => err.message));
  if (files.length > 0) {
    const fileErrors = ValidateFiles(files);
    if (fileErrors.length > 0) errors.push(...fileErrors);
  }

  if (errors.length > 0) {
    return errorResponse(res, "Validation failed", errors, 400);
  }
  next();
};

// const validateTextData = (data) => {
//   const errors = {};
//   console.log(data);

//   if (!data.name) {
//     errors.name = "Name is required";
//   }

//   if (!data.price) {
//     errors.price = "Price is required";
//   }

//   if (!data.category_id) {
//     errors.category_id = "Category ID is required";
//   }

//   if (!data.stock_quantity) {
//     errors.stock_quantity = "Stock quantity is required";
//   }
//   return errors;
// };

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
};
