require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// 1. Cấu hình giá tiền thực tế (VNĐ)
const priceConfigs = {
  1:  { min: 4500000,  max: 22000000 }, // Giường
  2:  { min: 7000000,  max: 40000000 }, // Sofa
  3:  { min: 500000,   max: 4500000  }, // Ghế
  4:  { min: 1200000,  max: 12000000 }, // Bàn
  5:  { min: 350000,   max: 8000000  }, // Đèn
  6:  { min: 4500000,  max: 70000000 }, // Tivi & Kệ
  7:  { min: 11000000, max: 60000000 }, // Laptop
  8:  { min: 3500000,  max: 18000000 }, // Tủ
  9:  { min: 1800000,  max: 10000000 }, // Cửa sổ
  10: { min: 3000000,  max: 25000000 }, // Cửa chính
  11: { min: 180000,   max: 3000000  }, // Cây
  12: { min: 120000,   max: 4000000  }  // Tranh
};

const folderToCategory = {
  'bed': 1, 'sofa': 2, 'chair': 3, 'table': 4, 'lamp': 5, 'tv': 6,
  'laptop': 7, 'wardrobe': 8, 'window': 9, 'door': 10, 'potted plant': 11, 'photo frame': 12
};

const templates = {
  1: { brands: ["Erado", "Hòa Phát"], styles: ["Hiện đại"], prefix: "Giường ngủ" },
  2: { brands: ["Divano", "Casa Bella"], styles: ["Luxury"], prefix: "Sofa" },
  3: { brands: ["Capta", "Minh Thy"], styles: ["Bắc Âu"], prefix: "Ghế" },
  4: { brands: ["Kifa", "Lux Table"], styles: ["Minimalist"], prefix: "Bàn trà" },
  5: { brands: ["Philips", "Panasonic"], styles: ["Cổ điển"], prefix: "Đèn" },
  6: { brands: ["Samsung", "Sony"], styles: ["Smart"], prefix: "Tivi" },
  7: { brands: ["Apple", "Dell"], styles: ["Ultrabook"], prefix: "Laptop" },
  8: { brands: ["An Cường"], styles: ["Âm tường"], prefix: "Tủ quần áo" },
  9: { brands: ["Xingfa"], styles: ["Cách âm"], prefix: "Cửa sổ" },
  10: { brands: ["Austdoor"], styles: ["Thép vân gỗ"], prefix: "Cửa chính" },
  11: { brands: ["Green Decor"], styles: ["Phong thủy"], prefix: "Chậu cây" },
  12: { brands: ["Canvas Lux"], styles: ["Trang trí"], prefix: "Tranh" }
};

(async () => {
  console.log('🚀 Đang quét Cloudinary (Vui lòng đợi, 3911 ảnh)...');
  
  const productsMap = {};
  let nextCursor = null;
  let totalImg = 0;
  let nextId = 1; // ID tự tăng để tránh trùng giữa các category

  try {
    do {
      const result = await cloudinary.api.resources({
        resource_type: 'image', type: 'upload', prefix: 'catalog/',
        max_results: 500, next_cursor: nextCursor || undefined,
      });

      for (const img of result.resources) {
        totalImg++;
        const parts = img.public_id.split('/'); 

        if (parts.length > 2) {
          const folderKey = parts[1].toLowerCase().trim();
          const category_id = folderToCategory[folderKey];
          
          if (!category_id) continue;

          const filename = parts[parts.length - 1];
          // REGEX MỚI: Lấy số bất kỳ trong tên file thay vì chỉ ở đầu file
          const matchId = filename.match(/(\d+)/);
          const raw_id = matchId ? matchId[1] : '0';

          // TẠO KEY DUY NHẤT: Kết hợp folder + mã số để không bị trùng (Vd: chair_516 khác bed_516)
          const productUniqueKey = `${folderKey}_${raw_id}`;

          if (!productsMap[productUniqueKey]) {
            const config = priceConfigs[category_id];
            const temp = templates[category_id];
            const brand = temp.brands[Math.floor(Math.random() * temp.brands.length)];
            
            let price = Math.floor(Math.random() * (config.max - config.min + 1) + config.min);
            price = Math.round(price / 10000) * 10000;

            productsMap[productUniqueKey] = {
              id: nextId++, // ID duy nhất cho Database
              name: `${temp.prefix} ${brand} ${temp.styles[0]} - ${raw_id}`,
              description: `${temp.prefix} cao cấp thương hiệu ${brand}. Bảo hành 12 tháng.`,
              price,
              category_id,
              status: "active",
              brand,
              rating: Number((4.1 + Math.random() * 0.9).toFixed(1)),
              reviews: Math.floor(Math.random() * 500)
            };
          }
        }
      }
      nextCursor = result.next_cursor;
      process.stdout.write(`...Đã quét ${totalImg} ảnh\r`);
    } while (nextCursor);

    const finalProducts = Object.values(productsMap);
    fs.writeFileSync('products.json', JSON.stringify(finalProducts, null, 2));

    console.log('\n\n📊 KẾT QUẢ PHÂN LOẠI (THÀNH CÔNG):');
    const stats = {};
    finalProducts.forEach(p => stats[p.category_id] = (stats[p.category_id] || 0) + 1);

    Object.entries(folderToCategory).forEach(([name, id]) => {
      console.log(`   - ${name.padEnd(15)} (ID: ${String(id).padEnd(2)}): ${stats[id] || 0} sản phẩm`);
    });

    console.log(`\n🎉 XONG! Đã tạo products.json với ${finalProducts.length} sản phẩm thực tế.`);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  }
})();