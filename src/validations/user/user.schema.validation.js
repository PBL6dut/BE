const Joi = require("joi");
const {
  checkCustomerEmail,
  checkCustomerPhone,
} = require("../../models/user.model");

const schema = Joi.object({
  full_name: Joi.string().min(2).max(100).required().messages({
    "string.base": "Họ và tên phải là một chuỗi ký tự",
    "string.empty": "Họ và tên không được để trống",
    "string.min": "Họ và tên phải có ít nhất {#limit} ký tự",
    "string.max": "Họ và tên không được vượt quá {#limit} ký tự",
    "any.required": "Họ và tên là bắt buộc",
  }),
  email: Joi.string().email().optional().messages({
    "string.base": "Email phải là một chuỗi ký tự",
    "string.email": "Email không hợp lệ",
  }),
  google_id: Joi.string().optional().messages({
    "string.base": "Google ID phải là một chuỗi ký tự",
  }),
  facebook_id: Joi.string().optional().messages({
    "string.base": "Facebook ID phải là một chuỗi ký tự",
  }),
  password: Joi.string().min(6).required().messages({
    "string.base": "Mật khẩu phải là một chuỗi ký tự",
    "string.empty": "Mật khẩu không được để trống",
    "string.min": "Mật khẩu phải có ít nhất {#limit} ký tự",
    "any.required": "Mật khẩu là bắt buộc",
  }),
  phone: Joi.string()
    .pattern(/^[0-9]{10,11}$/)
    .required()
    .messages({
      "string.base": "Số điện thoại phải là một chuỗi ký tự",
      "string.pattern.base": "Số điện thoại không hợp lệ",
      "any.required": "Số điện thoại là bắt buộc",
    }),
  address: Joi.string().max(200).messages({
    "string.base": "Địa chỉ phải là một chuỗi ký tự",
    "string.max": "Địa chỉ không được vượt quá {#limit} ký tự",
  }),
});

module.exports = {
  schema,
};
