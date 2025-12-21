// file: check-models.js
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function listModels() {
  console.log("🔍 Đang kết nối tới Google để lấy danh sách Model...");
  
  try {
    const response = await fetch(URL);
    const data = await response.json();

    if (data.error) {
      console.error("❌ Lỗi API:", data.error.message);
      return;
    }

    if (!data.models) {
        console.log("⚠️ Không tìm thấy danh sách models.");
        return;
    }

    console.log("✅ Danh sách các Model khả dụng cho Key của bạn:");
    console.log("------------------------------------------------");
    
    // Lọc ra các model dùng để chat (generateContent)
    const chatModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent") && m.name.includes("flash"));
    
    chatModels.forEach(model => {
      console.log(`- Tên chuẩn: \x1b[32m${model.name.replace('models/', '')}\x1b[0m`); // In màu xanh lá
      console.log(`  Mô tả: ${model.displayName}`);
      console.log(`  Version: ${model.version}`);
      console.log(`  Phương thức hỗ trợ: ${model.supportedGenerationMethods.join(", ")}`);
      console.log("---");
    });

  } catch (error) {
    console.error("❌ Lỗi kết nối mạng:", error);
  }
}

listModels();