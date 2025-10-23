const Joi = require("joi");
const { errorResponse } = require("../utils/response");

const orderSchema = Joi.object({
  customer_id: Joi.number().integer().required(),
  status: Joi.string()
    .valid("pending", "shipped", "delivered", "cancelled", "confirmed")
    .required(),
  payment_method: Joi.string()
    .valid("credit_card", "bank_transfer", "cash_on_delivery", "e-wallet", 'installment')
    .required(),
  paid_at: Joi.date().optional().allow(null),
  shipping_method: Joi.string()
    .valid("standard_delivery", "express_delivery", "same_day_delivery", "pickup_at_store", "installation_service")
    .required(),
  shipping_address: Joi.string().max(255).required(),
  phone: Joi.string()
    .pattern(/^[0-9+\-() ]{7,20}$/)
    .required(),
  expected_delivery_date: Joi.date().optional().allow(null),
  notes: Joi.string().max(500).optional().allow(null),
  order_details: Joi.array()
    .required()
    .items(
      Joi.object({
        product_id: Joi.number().integer().required(),
        quantity: Joi.number().integer().min(1).required(),
      })
    ),
});

const validateCreateOrder = (req, res, next) => {
  const data = req.body;
  if (!data) {
    return errorResponse(res, "Validation failed", "No data provided", 400);
  }

  const { error: orderError } = orderSchema.validate(data, {
    abortEarly: false,
  });
  if (orderError) {
    const errors = orderError.details.map((detail) =>
      detail.message.replace(/["]/g, "")
    );
    return errorResponse(res, "Validation failed", errors, 400);
  }

  next();
};

module.exports = {
  validateCreateOrder,
};
