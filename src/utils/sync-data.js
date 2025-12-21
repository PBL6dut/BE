require("dotenv").config();
// Lưu ý: Kiểm tra lại đường dẫn tới file prisma-client của bạn xem đúng chưa
const prisma = require("./prisma-client"); // Ví dụ: sửa lại đường dẫn cho đúng cấu trúc folder
const { Pinecone } = require("@pinecone-database/pinecone");
const { PineconeStore } = require("@langchain/pinecone");
// Thêm thư viện Gemini
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { TaskType } = require("@google/generative-ai");

async function runSync() {
  try {
    // 1. Cấu hình Gemini Embeddings
    const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GEMINI_API_KEY,
        modelName: "text-embedding-004", // Model vector của Google
        taskType: TaskType.RETRIEVAL_DOCUMENT,
    });
    
    console.log("📥 Đang lấy dữ liệu từ Database qua Prisma...");

    // 2. Query lấy dữ liệu (Đã sửa lại cấu trúc select)
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        description: true, // Đã thêm trường này (lúc nãy thiếu)
        price: true,
        // Nếu category là quan hệ bảng, phải select kiểu này mới lấy được name
        category: {
            select: {
                name: true
            }
        },
        material: true,
        color: true,
        height: true,
        width: true,
        length: true,
        weight: true,
        style: true,
      },
    });

    if (products.length === 0) {
      console.log("⚠️ Không có dữ liệu để đồng bộ.");
      return;
    }

    // 3. Kết nối Pinecone
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    // QUAN TRỌNG: Index này phải có Dimension = 768 (do dùng Gemini)
    const pineconeIndex = pinecone.Index("furniture-shop"); 

    console.log(`commencing sync for ${products.length} products...`);

    // 4. Chia nhỏ (Batching) để tránh lỗi mạng hoặc quá tải
    const batchSize = 100;
    
    for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        console.log(`🔄 Đang đẩy đợt ${i / batchSize + 1}: Sản phẩm ${i} -> ${i + batch.length}`);

        await PineconeStore.fromDocuments(
            batch.map((p) => {
                // Xử lý null an toàn (nếu description null thì thay bằng chuỗi rỗng)
                const categoryName = p.category ? p.category.name : "Unknown";
                const desc = p.description || ""; 

                return {
                    pageContent: `Sản phẩm: ${p.name}. 
                                Mô tả: ${desc}. 
                                Giá: ${p.price}. 
                                Loại: ${categoryName}. 
                                Chất liệu: ${p.material}. 
                                Màu sắc: ${p.color}. 
                                Kích thước (C x R x D): ${p.height} x ${p.width} x ${p.length}. 
                                Trọng lượng: ${p.weight}. 
                                Phong cách: ${p.style}.`,
                    metadata: { 
                        productId: p.id, 
                        price: p.price,
                        category: categoryName 
                    },
                };
            }),
            embeddings, // Đã sửa: Truyền biến embeddings của Gemini vào đây
            { pineconeIndex }
        );
        
        // Nghỉ 1 xíu để API thở
        await new Promise(r => setTimeout(r, 500));
    }

    console.log("✅ Đồng bộ thành công tất cả sản phẩm!");
  } catch (error) {
    console.error("❌ Lỗi đồng bộ:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runSync();