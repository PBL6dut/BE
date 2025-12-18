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

  // Liệt kê các folders trong catalog
  let validCatalogTypes = [];
  try {
    console.log('📁 Đang liệt kê các loại catalog từ Cloudinary...\n');
    const foldersResult = await cloudinary.api.sub_folders(CATALOG_ROOT);
    validCatalogTypes = foldersResult.folders.map(f => f.name).sort();

    console.log('📂 Các loại catalog trong thư mục "catalog":');
    console.log('-'.repeat(70));
    validCatalogTypes.forEach((folder, index) => {
      console.log(`   ${index + 1}. ${folder}`);
    });
    console.log('-'.repeat(70));
    console.log(`✅ Tổng cộng: ${validCatalogTypes.length} loại catalog\n`);
  } catch (err) {
    console.error('⚠️ Không thể liệt kê folders:', err.message, '\n');
  }

  const allImages = []; // Mảng các object { product_id: number, url: string }
  const catalogStats = {}; // Thống kê theo từng loại catalog
  const invalidImages = []; // Ảnh không nằm trong catalog hợp lệ
  const skippedImages = []; // Ảnh không parse được product_id
  const productIdMap = {}; // Map để tạo product_id unique: "catalog_type:number" -> unique_id
  let nextProductId = 1; // Product ID tự động tăng
  let nextCursor = null;
  let total = 0;
  let processedCount = 0; // Tổng số ảnh đã xử lý (bao gồm cả bỏ qua)

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
        processedCount++;

        // Lấy loại catalog (subfolder)
        const parts = publicId.split('/');
        const catalogType = parts.length >= 2 ? parts[1] : 'unknown';

        // Kiểm tra xem catalog type có hợp lệ không
        if (validCatalogTypes.length > 0 && !validCatalogTypes.includes(catalogType)) {
          invalidImages.push({ publicId, catalogType });
          continue; // Bỏ qua ảnh không hợp lệ
        }

        // Khởi tạo thống kê cho catalog type nếu chưa có
        if (!catalogStats[catalogType]) {
          catalogStats[catalogType] = { total: 0, matched: 0 };
        }
        catalogStats[catalogType].total++;

        // Tách tên file (bỏ extension)
        const filename = publicId.split('/').pop(); // "25_3" hoặc "000001" hoặc "lamp1"
        const nameWithoutExt = filename.split('.').shift();

        // Lấy số đầu tiên trong tên file (bất kỳ vị trí nào)
        const match = nameWithoutExt.match(/(\d+)/); // tìm dãy số đầu tiên: lamp1 → 1, tv123 → 123
        if (match) {
          const fileNumber = parseInt(match[1], 10);

          // Tạo key unique cho mỗi sản phẩm: "catalog_type:number"
          const productKey = `${catalogType}:${fileNumber}`;

          // Nếu chưa có product_id cho key này, tạo mới
          if (!productIdMap[productKey]) {
            productIdMap[productKey] = nextProductId++;
          }

          const product_id = productIdMap[productKey];

          allImages.push({
            product_id,
            url
          });

          catalogStats[catalogType].matched++;
          total++;
        } else {
          // Không parse được product_id từ tên file (không có số nào)
          skippedImages.push({ publicId, catalogType, filename: nameWithoutExt });
        }
      }

      nextCursor = result.next_cursor;
      console.log(`   Đã xử lý thêm ${result.resources.length} ảnh → Hợp lệ: ${total} | Tổng: ${processedCount}`);

    } while (nextCursor);

    // Sắp xếp theo product_id để dễ kiểm tra
    allImages.sort((a, b) => a.product_id - b.product_id);

    // Ghi ra file JSON
    const outputPath = path.join(process.cwd(), 'product_images.json');
    fs.writeFileSync(outputPath, JSON.stringify(allImages, null, 2), 'utf-8');

    // Thống kê nhanh
    const uniqueProducts = [...new Set(allImages.map(i => i.product_id))].length;
    const catalogTypes = Object.keys(catalogStats).sort();
    const totalCatalogTypes = catalogTypes.length;

    console.log('\n' + '='.repeat(70));
    console.log('✅ HOÀN TẤT! Đã tạo product_images.json đúng model Prisma');
    console.log('='.repeat(70));
    console.log(`📊 Tổng ảnh: ${total}`);
    console.log(`🆔 Số product có ảnh: ${uniqueProducts}`);
    console.log(`📁 Số loại catalog: ${totalCatalogTypes}`);
    console.log(`💾 File lưu tại: ${outputPath}`);

    console.log('\n📂 Chi tiết các loại catalog trong Cloudinary:');
    console.log('-'.repeat(70));
    catalogTypes.forEach((type, index) => {
      const stats = catalogStats[type];
      const matched = stats.matched;
      const totalInCatalog = stats.total;
      const skipped = totalInCatalog - matched;
      console.log(`   ${index + 1}. ${type}: ${matched}/${totalInCatalog} ảnh hợp lệ${skipped > 0 ? ` (bỏ qua ${skipped})` : ''}`);
    });
    console.log('-'.repeat(70));

    console.log('\n💡 Ví dụ dữ liệu đầu ra:');
    console.log(JSON.stringify(allImages.slice(0, 10), null, 2));

    console.log('\n🔑 Ví dụ mapping product_id:');
    const exampleMappings = Object.entries(productIdMap).slice(0, 10);
    exampleMappings.forEach(([key, id]) => {
      console.log(`   ${key} → product_id: ${id}`);
    });
    console.log('='.repeat(70));

    // Hiển thị cảnh báo về ảnh không parse được product_id
    if (skippedImages.length > 0) {
      console.log('\n⚠️  CẢNH BÁO: Tìm thấy ảnh không parse được product_id');
      console.log('='.repeat(70));
      console.log(`📝 Số ảnh bị bỏ qua: ${skippedImages.length}`);
      console.log('\n🔍 Phân loại theo catalog:');
      const skippedByCatalog = {};
      skippedImages.forEach(img => {
        if (!skippedByCatalog[img.catalogType]) {
          skippedByCatalog[img.catalogType] = [];
        }
        skippedByCatalog[img.catalogType].push(img);
      });
      Object.keys(skippedByCatalog).sort().forEach((type, index) => {
        console.log(`   ${index + 1}. ${type}: ${skippedByCatalog[type].length} ảnh`);
      });
      console.log('\n💡 Ví dụ tên file không hợp lệ (không bắt đầu bằng số):');
      skippedImages.slice(0, 10).forEach(img => {
        console.log(`   - ${img.publicId} → filename: "${img.filename}"`);
      });
      console.log('='.repeat(70));
    }

    // Hiển thị cảnh báo về ảnh không hợp lệ
    if (invalidImages.length > 0) {
      console.log('\n⚠️  CẢNH BÁO: Tìm thấy ảnh không nằm trong catalog hợp lệ');
      console.log('='.repeat(70));
      console.log(`📝 Số ảnh bị bỏ qua: ${invalidImages.length}`);
      console.log('\n🔍 Các loại catalog không hợp lệ:');
      const invalidTypes = [...new Set(invalidImages.map(i => i.catalogType))].sort();
      invalidTypes.forEach((type, index) => {
        const count = invalidImages.filter(i => i.catalogType === type).length;
        console.log(`   ${index + 1}. ${type}: ${count} ảnh`);
      });
      console.log('\n💡 Ví dụ public_id không hợp lệ:');
      invalidImages.slice(0, 5).forEach(img => {
        console.log(`   - ${img.publicId}`);
      });
      console.log('='.repeat(70));
    }

  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  }
})();