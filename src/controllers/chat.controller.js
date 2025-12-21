// src/controllers/chat.controller.js
const { StatusCodes } = require('http-status-codes');
const ChatService = require('../services/chat.service');
const { successResponse, errorResponse } = require('../utils/response');
const { default: ApiError } = require('../utils/ApiError');

class ChatController {
  
  // [POST] /api/chat
  async chat(req, res, next) {
    try {
      const { question } = req.body;

      if (!question) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Get chat response failed', 'Question is required');
      }

      // Gọi Service
      const result = await ChatService.findProductsByAI(question);

    //   return res.status(200).json({
    //     success: true,
    //     data: result
    //   });
      return successResponse(res, 'Get chat response successfully', result, StatusCodes.OK);

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatController();