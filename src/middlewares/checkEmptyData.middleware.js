const { errorResponse } = require("../utils/response");

const checkEmptyData = (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return errorResponse(res, "Bad Request", "Request body cannot be empty", null, 400);
  }
    next();
};

module.exports = {
  checkEmptyData,
};