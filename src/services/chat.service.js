const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { HumanMessage, AIMessage, ToolMessage } = require("@langchain/core/messages");
const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const prisma = require("../utils/prisma-client");

// KHO LƯU TRỮ LỊCH SỬ (RAM) - Key: sessionId
const chatHistoryMap = new Map();

class ChatService {
  constructor() {
    this.chatModel = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
      model: "gemini-3-flash-preview", // Hoặc "gemini-1.5-flash" nếu bản 3 chưa ổn định
      temperature: 0,
    });

    this.metadataCache = null;
    this.lastCacheTime = 0;
  }

  // --- QUẢN LÝ HISTORY ---
  getHistory(sessionId) {
    if (!chatHistoryMap.has(sessionId)) {
      chatHistoryMap.set(sessionId, []);
    }
    return chatHistoryMap.get(sessionId);
  }

  saveHistory(sessionId, messages) {
    let history = this.getHistory(sessionId);
    // Giữ 20 tin nhắn gần nhất
    history = [...history, ...messages].slice(-20);
    chatHistoryMap.set(sessionId, history);
  }

  async clearHistory(sessionId) {
    chatHistoryMap.delete(sessionId);
  }

  // 1. Hàm lấy Metadata (Giữ nguyên của bạn)
  async getDatabaseMetadata() {
    const NOW = Date.now();
    if (this.metadataCache && NOW - this.lastCacheTime < 3600000) {
      return this.metadataCache;
    }

    const categories = await prisma.category.findMany({ select: { name: true } });
    const materials = await prisma.product.findMany({ select: { material: true }, distinct: ["material"] });
    const colors = await prisma.product.findMany({ select: { color: true }, distinct: ["color"] });
    const styles = await prisma.product.findMany({ select: { style: true }, distinct: ["style"] });
    const ratings = await prisma.product.findMany({ select: { rating: true }, distinct: ["rating"] });

    this.metadataCache = {
      categoryList: categories.map((c) => c.name).join(", "),
      materialList: materials.map((m) => m.material).filter(Boolean).join(", "),
      colorList: colors.map((c) => c.color).filter(Boolean).join(", "),
      styleList: styles.map((s) => s.style).filter(Boolean).join(", "),
      ratingList: ratings.map((r) => r.rating).filter(Boolean).join(", "),
    };
    this.lastCacheTime = NOW;

    return this.metadataCache;
  }

  // 2. TẠO TOOL SEARCH (Đưa logic Strategy của bạn vào đây)
  createSearchTool(metadata) {
    return tool(
      async (filters) => {
        console.log("🛠️ AI gọi Tool với filters:", filters);
        
        // --- LOGIC CHIẾN THUẬT CỦA BẠN (ĐƯỢC GIỮ NGUYÊN) ---
        // Lọc bỏ các key undefined/null để lấy danh sách key thực tế
        const filtersKeys = Object.keys(filters).filter(key => filters[key] !== undefined && filters[key] !== null);
        
        const searchStrategies2 = [];
        // Tạo chiến thuật cắt lớp (Slicing) như bạn yêu cầu
        for (let i = filtersKeys.length; i >= 1; i--) {
          searchStrategies2.push(filtersKeys.slice(0, i));
        }
        console.log("Generated Strategies inside Tool:", searchStrategies2);

        let finalProducts = [];
        let seenProductIds = new Set();

        // Chạy vòng lặp chiến thuật
        for (const strategy of searchStrategies2) {
            if (finalProducts.length >= 5) break;

            console.log(`🔍 Thử chiến thuật: [${strategy.join(", ")}]`);

            let whereClause = {};

            // Map logic dynamic where clause của bạn
            if (strategy.includes("category") && filters.category) {
                whereClause.category = { name: { contains: filters.category } };
            }
            if (strategy.includes("maxPrice") && filters.maxPrice) {
                whereClause.price = { lte: filters.maxPrice };
            }
            if (strategy.includes("minPrice") && filters.minPrice) {
                whereClause.price = { ...whereClause.price, gte: filters.minPrice };
            }
            if (strategy.includes("color") && filters.color) {
                whereClause.color = { contains: filters.color };
            }
            if (strategy.includes("material") && filters.material) {
                whereClause.material = { contains: filters.material };
            }
            if (strategy.includes("style") && filters.style) {
                whereClause.style = { contains: filters.style };
            }
            if (strategy.includes("rating") && filters.rating) {
                whereClause.rating = filters.rating;
            }

            try {
                const products = await prisma.product.findMany({
                    where: whereClause,
                    include: {
                        images: { select: { url: true } },
                        category: { select: { id: true, name: true } },
                    },
                    take: 5,
                    orderBy: { price: "asc" },
                });

                for (const p of products) {
                    if (!seenProductIds.has(p.id)) {
                        p.matchType = `Strategy: ${strategy.join("+")}`; // Đánh dấu
                        finalProducts.push(p);
                        seenProductIds.add(p.id);
                    }
                }
            } catch (err) {
                console.error("Lỗi query prisma:", err);
            }
        }

        if (finalProducts.length === 0) return "Không tìm thấy sản phẩm nào phù hợp.";

        // Trả về JSON String cho AI đọc
        // Map lại dữ liệu gọn gàng để tiết kiệm token
        return JSON.stringify(finalProducts);
      },
      {
        name: "search_furniture",
        description: "Tìm kiếm nội thất. Khi khách hàng hỏi mua sản phẩm, hãy dùng tool này để tìm.",
        schema: z.object({
          category: z.string().optional().describe(`Loại sản phẩm. Map về: ${metadata.categoryList}`),
          color: z.string().optional().describe(`Màu sắc. Map về: ${metadata.colorList}`),
          material: z.string().optional().describe(`Chất liệu. Map về: ${metadata.materialList}`),
          style: z.string().optional().describe(`Phong cách. Map về: ${metadata.styleList}`),
          maxPrice: z.number().optional().describe("Giá tối đa (VNĐ)"),
          minPrice: z.number().optional().describe("Giá tối thiểu (VNĐ)"),
          rating: z.number().optional().describe("Rating (số)"),
        }),
      }
    );
  }

  // 3. MAIN FUNCTION (Đã thêm SessionId và Lịch sử)
  async findProductsByAI(sessionId, question) {
    try {
      console.log(`User asking (Session ${sessionId}):`, question);

      // B1: Lấy Metadata & Tạo Tool
      const metadata = await this.getDatabaseMetadata();
      const searchTool = this.createSearchTool(metadata);
      
      // B2: Bind Tool vào Model
      const modelWithTools = this.chatModel.bindTools([searchTool]);

      // B3: Lấy Lịch sử & Tạo Message
      const history = this.getHistory(sessionId);
      const userMessage = new HumanMessage(question);
      const messages = [...history, userMessage]; // Gộp lịch sử cũ + câu mới

      const newMessagesBatch = [userMessage]; // Để lưu batch này
      let foundProductsRaw = []; // Để hứng dữ liệu trả về Frontend

      // B4: Gọi AI lần 1
      const aiResponse = await modelWithTools.invoke(messages);
      messages.push(aiResponse);
      newMessagesBatch.push(aiResponse);

      // B5: Check Tool Call
      if (aiResponse.tool_calls && aiResponse.tool_calls.length > 0) {
        
        for (const toolCall of aiResponse.tool_calls) {
            if (toolCall.name === "search_furniture") {
                // Thực thi Tool
                // SỬA LỖI: Truyền toolCall.args thay vì toolCall
                const toolOutputString = await searchTool.invoke(toolCall.args);
                
                // Parse lại để lấy object trả về Frontend
                try {
                    // Kiểm tra kỹ hơn trước khi parse
                    if (toolOutputString && toolOutputString !== "Không tìm thấy sản phẩm nào phù hợp.") {
                        foundProductsRaw = JSON.parse(toolOutputString);
                    }
                } catch (e) {
                    console.error("❌ Lỗi Parse JSON sản phẩm:", e);
                    // Log ra xem chuỗi bị lỗi là gì
                    console.log("Chuỗi gây lỗi:", toolOutputString);
                }

                // Đóng gói kết quả Tool
                const toolMsg = new ToolMessage({
                    tool_call_id: toolCall.id,
                    content: toolOutputString
                });
                
                messages.push(toolMsg);
                newMessagesBatch.push(toolMsg);
            }
        }

        // B6: Gọi AI lần 2 để sinh câu trả lời cuối cùng
        const finalResponse = await modelWithTools.invoke(messages);
        newMessagesBatch.push(finalResponse);

        // Lưu toàn bộ vào lịch sử
        this.saveHistory(sessionId, newMessagesBatch);

        return {
            answer: finalResponse.content,
            products: foundProductsRaw // Trả list sản phẩm về FE hiển thị
        };

      } else {
        // Chat xã giao, không gọi tool
        this.saveHistory(sessionId, newMessagesBatch);
        return {
            answer: aiResponse.content,
            products: []
        };
      }

    } catch (error) {
      console.error("Lỗi ChatService:", error);
      return {
        answer: "Xin lỗi, hệ thống đang bận chút xíu, bạn thử lại sau nha!",
        products: []
      };
    }
  }
}

module.exports = new ChatService();