// generate_product_images_prisma.js
require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const CATALOG_ROOT = 'catalog';

(async () => {
  console.log('🚀 Bắt đầu tạo product_images.json theo model Prisma...\n');

  const allImages = []; // Mảng các object { product_id: number, url: string }
  let nextCursor = null;
  let total = 0;

  try {
    do {
      const result = await cloudinary.api.resources({
        resource_type: 'image',
        type: 'upload',
        prefix: CATALOG_ROOT,
        max_results: 500,
        next_cursor: nextCursor || undefined,
      });

      for (const img of result.resources) {
        const publicId = img.public_id; // ví dụ: catalog/sofa/25_3
        const url = img.secure_url;

        // Tách tên file (bỏ extension)
        const filename = publicId.split('/').pop(); // "25_3" hoặc "000001" hoặc "1"
        const nameWithoutExt = filename.split('.').shift();

        // Lấy số đầu tiên trong tên file → đây chính là product_id
        const match = nameWithoutExt.match(/^0*(\d+)/); // xử lý cả 0001 → 1, 001 → 1
        if (match) {
          const product_id = parseInt(match[1], 10);
          
          allImages.push({
            product_id,
            url
          });

          total++;
        }
      }

      nextCursor = result.next_cursor;
      console.log(`   Đã xử lý thêm ${result.resources.length} ảnh → Tổng: ${total}`);

    } while (nextCursor);

    // Sắp xếp theo product_id để dễ kiểm tra
    allImages.sort((a, b) => a.product_id - b.product_id);

    // Ghi ra file JSON
    const outputPath = path.join(process.cwd(), 'product_images.json');
    fs.writeFileSync(outputPath, JSON.stringify(allImages, null, 2), 'utf-8');

    // Thống kê nhanh
    const uniqueProducts = [...new Set(allImages.map(i => i.product_id))].length;

    console.log('\n' + '='.repeat(70));
    console.log('✅ HOÀN TẤT! Đã tạo product_images.json đúng model Prisma');
    console.log('='.repeat(70));
    console.log(`📊 Tổng ảnh: ${total}`);
    console.log(`🆔 Số product có ảnh: ${uniqueProducts}`);
    console.log(`💾 File lưu tại: ${outputPath}`);
    console.log('\nVí dụ dữ liệu đầu ra:');
    console.log(JSON.stringify(allImages.slice(0, 10), null, 2));
    console.log('='.repeat(70));

  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  }
})();