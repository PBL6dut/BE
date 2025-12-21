const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { RunnableSequence } = require("@langchain/core/runnables");
const prisma = require("../utils/prisma-client");

class ChatService {
  constructor() {
    // Chỉ cần khởi tạo Gemini Chat Model
    this.chatModel = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY, // Sửa lại tên biến môi trường cho đúng với bên dưới
      model: "gemini-2.5-flash-lite",
      temperature: 0, // Để 0 khi trích xuất data
    });

    // Biến Cache để lưu metadata (tránh query DB liên tục)
    this.metadataCache = null;
    this.lastCacheTime = 0;
  }

  // 1. Hàm lấy Metadata (Có Caching 1 tiếng)
  async getDatabaseMetadata() {
    const NOW = Date.now();
    // Nếu đã có cache và chưa quá 1 tiếng (3600000ms) -> Dùng lại
    if (this.metadataCache && NOW - this.lastCacheTime < 3600000) {
      return this.metadataCache;
    }

    // Nếu chưa có thì query DB
    const categories = await prisma.category.findMany({
      select: { name: true },
    });
    const materials = await prisma.product.findMany({
      select: { material: true },
      distinct: ["material"],
    });
    const colors = await prisma.product.findMany({
      select: { color: true },
      distinct: ["color"],
    });

    this.metadataCache = {
      categoryList: categories.map((c) => c.name).join(", "),
      materialList: materials
        .map((m) => m.material)
        .filter(Boolean)
        .join(", "),
      colorList: colors
        .map((c) => c.color)
        .filter(Boolean)
        .join(", "),
    };
    this.lastCacheTime = NOW;

    return this.metadataCache;
  }

  // 2. Hàm trích xuất filter từ câu hỏi
  async extractFilters(question) {
    const { categoryList, materialList, colorList } =
      await this.getDatabaseMetadata();

    const prompt = PromptTemplate.fromTemplate(`
        Bạn là trợ lý trích xuất thông tin nội thất.
        DỮ LIỆU CHUẨN TRONG KHO:
        - Categories: [${categoryList}]
        - Colors: [${colorList}]
        - Materials: [${materialList}]
        
        Câu hỏi: "{question}"
        
        Nhiệm vụ:
        1. Map từ đồng nghĩa về từ chuẩn trong danh sách trên (salon -> sofa, gỗ sồi -> gỗ).
        2. Trích xuất JSON tìm kiếm.
        
        Output JSON format: 
        {{ 
            "category": "string (bắt buộc, phải nằm trong list Categories)", 
            "maxPrice": "number (nếu có)", 
            "color": "string (nếu có, phải nằm trong list Colors)", 
            "material": "string (nếu có, phải nằm trong list Materials)" 
        }}
        
        CHỈ TRẢ VỀ JSON DUY NHẤT.
     `);

    const chain = RunnableSequence.from([
      prompt,
      this.chatModel,
      new StringOutputParser(),
    ]);

    const jsonString = await chain.invoke({ question });
    const cleanJson = jsonString.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  }

  // 3. Hàm tạo câu trả lời thân thiện (Bước mới thêm)
  async generateFriendlyAnswer(question, products) {
    // Nếu không có sản phẩm nào
    if (!products || products.length === 0) {
      return "Dạ em tìm kỹ rồi mà hiện tại trong kho không có mẫu nào phù hợp với yêu cầu của anh/chị ạ. Anh/chị thử đổi tiêu chí khác xem sao ạ?";
    }

    // Nếu có sản phẩm, nhờ AI viết lời giới thiệu
    const context = products
      .slice(0, 3)
      .map(
        (p, i) =>
          `${i + 1}. ${p.name} - Giá: ${p.price.toLocaleString(
            "vi-VN"
          )}đ - Màu: ${p.color} - Chất liệu: ${p.material} (Độ khớp: ${
            p.score
          } điểm)`
      )
      .join("\n");

    const prompt = PromptTemplate.fromTemplate(`
        Bạn là nhân viên bán hàng nhiệt tình.
        Khách hỏi: "{question}"
        
        Hệ thống tìm được danh sách sản phẩm tốt nhất dưới đây:
        ${context}
        
        Yêu cầu:
        - Trả lời khách hàng ngắn gọn, thân thiện (có emoji 😊).
        - Giới thiệu khéo léo sản phẩm đứng đầu (số 1).
        - Nhắc khách bấm vào hình bên dưới để xem chi tiết.
    `);

    // Dùng model temperature cao hơn xíu để văn phong tự nhiên
    const chatModelCreative = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
      model: "gemini-2.5-flash-lite",
      temperature: 0.7,
    });

    const chain = RunnableSequence.from([
      prompt,
      chatModelCreative,
      new StringOutputParser(),
    ]);
    return await chain.invoke({ question });
  }

  // 4. MAIN FUNCTION
  async findProductsByAI(question) {
    try {
      console.log("user asking:", question);

      // B1: Trích xuất Filters
      const filters = await this.extractFilters(question);

      if (!filters.category) {
        return []; // Không biết tìm loại gì thì chịu
      }

      // 2. Định nghĩa các cấp độ ưu tiên (Strategy List)
      // Mỗi cấp độ là một object chứa các trường cần filter
      const searchStrategies = [
        {
          name: "Tuyệt đối (Perfect)",
          useFields: ["category", "maxPrice", "color", "material"],
        },
        {
          name: "Bỏ chất liệu",
          useFields: ["category", "maxPrice", "color"],
        },
        {
          name: "Bỏ màu sắc (Chỉ giữ Giá + Loại)",
          useFields: ["category", "maxPrice"],
        },
        {
          name: "Chỉ cùng Loại (Gợi ý chung)",
          useFields: ["category"],
        },
      ];

      let finalProducts = [];
      let seenProductIds = new Set(); // Để tránh trùng lặp nếu chạy nhiều query

      // 3. Chạy vòng lặp chiến thuật
      for (const strategy of searchStrategies) {
        // Nếu đã tìm đủ 5 sản phẩm thì dừng ngay, không tìm thêm nữa
        if (finalProducts.length >= 5) break;

        console.log(`🔍 Đang thử chiến thuật: ${strategy.name}...`);

        // Xây dựng whereClause động dựa trên strategy hiện tại
        const whereClause = {
          category: { name: { contains: filters.category } }, // Luôn giữ Category
        };

        // Chỉ thêm các điều kiện nếu strategy yêu cầu VÀ filter có dữ liệu
        if (strategy.useFields.includes("maxPrice") && filters.maxPrice) {
          whereClause.price = { lte: filters.maxPrice };
        }
        if (strategy.useFields.includes("color") && filters.color) {
          whereClause.color = { contains: filters.color };
        }
        if (strategy.useFields.includes("material") && filters.material) {
          whereClause.material = { contains: filters.material };
        }

        // Query Database
        const products = await prisma.product.findMany({
          where: whereClause,
          take: 5, // Lấy thử 5 cái mỗi lần
          orderBy: { price: "asc" }, // Ưu tiên rẻ trước nếu muốn
        });

        // 4. Merge kết quả (Lọc trùng)
        for (const p of products) {
          if (!seenProductIds.has(p.id)) {
            // Đánh dấu sản phẩm này thuộc chiến thuật nào (để AI giải thích)
            p.matchType = strategy.name;

            finalProducts.push(p);
            seenProductIds.add(p.id);
          }
        }
      }
      // B5: Sinh câu trả lời (QUAN TRỌNG)
      const aiAnswer = await this.generateFriendlyAnswer(question, finalProducts);

      // Trả về format chuẩn cho Controller
      return {
        answer: aiAnswer,
        products: finalProducts,
      };
    } catch (error) {
      console.error("Lỗi ChatService:", error);
      // Fallback an toàn
      return {
        answer:
          "Xin lỗi, hệ thống đang gặp chút trục trặc. Anh/chị thử lại sau giây lát nhé!",
        products: [],
      };
    }
  }
}

module.exports = new ChatService();
