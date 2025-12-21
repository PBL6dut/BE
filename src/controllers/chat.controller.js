const ChatService = require('../services/chat.service');
const { v4: uuidv4 } = require('uuid'); // Nhớ cài: npm install uuid
const { successResponse } = require('../utils/response');

class ChatController {
  
  async chat(req, res, next) {
    try {
      // Client gửi lên: { question: "...", sessionId: "..." }
      let { question, sessionId } = req.body;

      // Nếu Client chưa có sessionId (Chat lần đầu) -> Tạo mới
      if (!sessionId) {
        sessionId = uuidv4();
        console.log("✨ Tạo session mới:", sessionId);
      }

      if (!question) {
        return res.status(400).json({ message: "Vui lòng nhập câu hỏi." });
      }

      // Gọi Service với sessionId
      const result = await ChatService.findProductsByAI(sessionId, question);

      // return res.status(200).json({
      //   success: true,
      //   sessionId: sessionId, // Trả lại sessionId để Client lưu cho lần sau
      //   answer: result.answer,
      //   products: result.products
      // });
      return successResponse(res, "Chat success", {
        sessionId: sessionId,
        answer: result.answer,
        products: result.products
      });

    } catch (error) {
        next(error);
    }
  }
  
  // API Reset (Xóa lịch sử khi khách bấm nút "Chat mới")
  async resetChat(req, res) {
      const { sessionId } = req.body;
      if (sessionId) {
          await ChatService.clearHistory(sessionId);
      }
      res.json({ success: true, message: "Đã làm mới cuộc trò chuyện." });
  }
}

module.exports = new ChatController();