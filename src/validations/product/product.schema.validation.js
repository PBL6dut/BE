const Joi = require("joi");

const schema = Joi.object({
  name: Joi.string().min(3).max(100).required().trim().strict().messages({
    "string.base": "Tên sản phẩm phải là một chuỗi ký tự",
    "string.empty": "Tên sản phẩm không được để trống",
    "string.min": "Tên sản phẩm phải có ít nhất {#limit} ký tự",
    "string.max": "Tên sản phẩm không được vượt quá {#limit} ký tự",
    "any.required": "Tên sản phẩm là bắt buộc",
  }),
  description: Joi.string().max(500).optional().messages({
    "string.base": "Mô tả sản phẩm phải là một chuỗi ký tự",
    "string.max": "Mô tả sản phẩm không được vượt quá {#limit} ký tự",
  }),
  price: Joi.number().positive().required().messages({
    "number.base": "Giá sản phẩm phải là một số",
    "number.positive": "Giá sản phẩm phải là một số dương",
    "any.required": "Giá sản phẩm là bắt buộc",
  }),
  sale_price: Joi.number().positive().optional().messages({
    "number.base": "Giá khuyến mãi phải là một số",
    "number.positive": "Giá khuyến mãi phải là một số dương",
  }),
  category_id: Joi.number().integer().required().messages({
    "number.base": "ID danh mục phải là một số",
    "number.integer": "ID danh mục phải là một số nguyên",
    "any.required": "ID danh mục là bắt buộc",
  }),
  stock_quantity: Joi.number().integer().min(0).required().messages({
    "number.base": "Số lượng tồn kho phải là một số",
    "number.integer": "Số lượng tồn kho phải là một số nguyên",
    "number.min": "Số lượng tồn kho phải lớn hơn hoặc bằng {#limit}",
    "any.required": "Số lượng tồn kho là bắt buộc",
  }),
  material: Joi.string().max(100).optional().messages({
    "string.base": "Chất liệu sản phẩm phải là một chuỗi ký tự",
    "string.max": "Chất liệu sản phẩm không được vượt quá {#limit} ký tự",
  }),
  color: Joi.string().max(50).required().messages({
    "string.base": "Màu sắc sản phẩm phải là một chuỗi ký tự",
    "string.max": "Màu sắc sản phẩm không được vượt quá {#limit} ký tự",
    "any.required": "Màu sắc sản phẩm là bắt buộc",
  }),
  height: Joi.number().positive().required().messages({
    "number.base": "Chiều cao phải là một số",
    "number.positive": "Chiều cao phải là một số dương",
    "any.required": "Chiều cao là bắt buộc",
  }),
  width: Joi.number().positive().required().messages({
    "number.base": "Chiều rộng phải là một số",
    "number.positive": "Chiều rộng phải là một số dương",
    "any.required": "Chiều rộng là bắt buộc",
  }),
  length: Joi.number().positive().required().messages({
    "number.base": "Chiều dài phải là một số",
    "number.positive": "Chiều dài phải là một số dương",
    "any.required": "Chiều dài là bắt buộc",
  }),
  weight: Joi.number().positive().required().messages({
    "number.base": "Trọng lượng phải là một số",
    "number.positive": "Trọng lượng phải là một số dương",
    "any.required": "Trọng lượng là bắt buộc",
  }),
  image_url: Joi.any().optional(),
});

module.exports = {
  schema,
};
