const { checkProductId } = require("../../models/product.model");
const { checkCustomerId } = require("../../models/user.model");
const Joi = require("joi");

const schema = Joi.object({
  customer_id: Joi.number()
    .integer()
    .required()
    .external(async (value, helpers) => {
      if (!(await checkCustomerId(value))) {
        return helpers.message(`Khách hàng với ID ${value} không tồn tại`);
      }
    })
    .messages({
      "number.base": "ID khách hàng phải là một số",
      "number.integer": "ID khách hàng phải là một số nguyên",
      "any.required": "ID khách hàng là bắt buộc",
    }),
  status: Joi.string()
    .valid("pending", "shipped", "delivered", "cancelled", "confirmed")
    .required()
    .messages({
      "any.only": "Trạng thái đơn hàng không hợp lệ",
      "any.required": "Trạng thái đơn hàng là bắt buộc",
    }),
  payment_method: Joi.string()
    .valid(
      "credit_card",
      "bank_transfer",
      "cash_on_delivery",
      "e-wallet",
      "installment"
    )
    .required()
    .messages({
      "any.only": "Phương thức thanh toán phải là một trong các giá trị {#valids}",
      "any.required": "Phương thức thanh toán là bắt buộc",
    }),
  paid_at: Joi.date().optional().allow(null),
  shipping_method: Joi.string()
    .valid(
      "standard_delivery",
      "express_delivery",
      "same_day_delivery",
      "pickup_at_store",
      "installation_service"
    )
    .required()
    .messages({
      "any.only": "Phương thức giao hàng phải là một trong các giá trị {#valids}",
      "any.required": "Phương thức giao hàng là bắt buộc",
    }),
  shipping_address: Joi.string().max(255).required().messages({
    "string.base": "Địa chỉ giao hàng phải là một chuỗi ký tự",
    "string.max": "Địa chỉ giao hàng không được vượt quá {#limit} ký tự",
    "any.required": "Địa chỉ giao hàng là bắt buộc",
  }),
  to_district_id: Joi.number().integer().required().messages({
    "number.base": "ID quận/huyện phải là một số",
    "number.integer": "ID quận/huyện phải là một số nguyên",
    "any.required": "ID quận/huyện là bắt buộc",
  }),
  to_ward_code: Joi.string().required().messages({
    "string.base": "Mã phường/xã phải là một chuỗi ký tự",
    "any.required": "Mã phường/xã là bắt buộc",
  }),
  phone: Joi.string()
    .pattern(/^[0-9+\-() ]{7,20}$/)
    .required()
    .messages({
      "string.pattern.base": "Số điện thoại không hợp lệ",
      "any.required": "Số điện thoại là bắt buộc",
    }),
  expected_delivery_date: Joi.date().optional().allow(null).messages({
    "date.base": "Ngày dự kiến giao hàng phải là một ngày",
  }),
  notes: Joi.string().max(500).optional().allow(null).messages({
    "string.base": "Ghi chú phải là một chuỗi ký tự",
    "string.max": "Ghi chú không được vượt quá {#limit} ký tự",
  }),
  order_details: Joi.array()
    .required()
    .items(
      Joi.object({
        product_id: Joi.number().integer().required().messages({
          "number.base": "ID sản phẩm phải là một số",
          "number.integer": "ID sản phẩm phải là một số nguyên",
          "any.required": "ID sản phẩm là bắt buộc",
        }),
        quantity: Joi.number().integer().min(1).required().messages({
          "number.base": "Số lượng phải là một số",
          "number.integer": "Số lượng phải là một số nguyên",
          "number.min": "Số lượng phải lớn hơn hoặc bằng {#limit}",
          "any.required": "Số lượng là bắt buộc",
        }),
      })
    ),
});

module.exports = {
  schema,
};
