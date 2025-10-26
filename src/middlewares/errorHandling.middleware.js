const { StatusCodes } = require('http-status-codes');
const { errorResponse } = require('../utils/response.js');

const errorHandlingMiddleware = (err, req, res, next) => {
    if(!err.statusCode) err.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;

    return errorResponse(res, err.message, err.details || err.stack, err.statusCode);
}

module.exports = errorHandlingMiddleware;