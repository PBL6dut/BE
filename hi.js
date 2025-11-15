// hi.js - PHIÊN BẢN HOÀN HẢO CUỐI CÙNG - CHẠY 100% KHÔNG LỖI
const fs = require('fs');
const path = require('path');

// Load product_images.json (phải để cùng thư mục)
const productImages = require('./data/product_images.json');

// 1. TẠO CATEGORIES.JSON
const categories = [
  { id: 1, name: "Giường ngủ", description: "Giường ngủ cao cấp, đa dạng kích thước 1m6, 1m8, 2m, chất liệu gỗ óc chó, gỗ hương, MDF phủ melamine." },
  { id: 2, name: "Sofa", description: "Sofa phòng khách sang trọng: sofa góc L, sofa văng, sofa bed đa năng. Da thật, nỉ cao cấp, vải bố chống xước." },
  { id: 3, name: "Ghế ăn & Ghế trang trí", description: "Ghế ăn gỗ, ghế bọc nệm, ghế cafe, ghế thư giãn. Thiết kế Bắc Âu, tân cổ điển, Indochine." },
  { id: 4, name: "Bàn trà & Bàn phụ", description: "Bàn trà sofa, bàn góc, bàn nâng hạ thông minh, bàn console nhập khẩu." },
  { id: 5, name: "Đèn trang trí", description: "Đèn thả trần, đèn bàn ngủ, đèn cây đứng, đèn LED hiện đại, đèn ngủ đầu giường." },
  { id: 6, name: "Tivi & Kệ tivi", description: "Tivi 4K, 8K Samsung, LG, Sony, TCL kèm kệ tivi treo tường gỗ óc chó, kệ kính." },
  { id: 7, name: "Laptop & Phụ kiện", description: "MacBook, Dell XPS, Asus ROG, MSI Gaming, Lenovo ThinkPad chính hãng." },
  { id: 8, name: "Tủ quần áo", description: "Tủ cánh lùa, tủ cánh mở, tủ âm tường, tủ gỗ tự nhiên, tủ kính cao cấp." },
  { id: 9, name: "Cửa sổ & Cửa sổ", description: "Cửa nhôm Xingfa, cửa nhựa lõi thép, cửa thép vân gỗ, cửa gỗ tự nhiên, phụ kiện cửa cao cấp." },
  { id: 10, name: "Cửa chính & Cửa phòng", description: "Cửa thép vân gỗ, cửa gỗ tự nhiên, cửa nhôm kính, cửa chống cháy cách âm." },
  { id: 11, name: "Cây cảnh trang trí", description: "Cây giả trang trí, cây xanh văn phòng, chậu composite, chậu gốm cao cấp." },
  { id: 12, name: "Khung tranh & Trang trí tường", description: "Tranh canvas, tranh sơn dầu, khung ảnh treo tường, gương soi toàn thân." }
];

fs.writeFileSync('categories.json', JSON.stringify(categories, null, 2), 'utf-8');
console.log('✅ Đã tạo categories.json (12 danh mục)');

// 2. MAP FOLDER → CATEGORY_ID
const folderToCategory = {
  'bed': 1,
  'sofa': 2,
  'chair': 3,
  'table': 4,
  'lamp': 5,
  'tv': 6,
  'laptop': 7,
  'wardrobe': 8,
  'window': 9,
  'door': 10,
  'potted plant': 11,
  'photo frame': 12
};

// 3. GROUP IMAGES THEO PRODUCT_ID
const productsMap = {};

productImages.forEach(item => {
  const url = item.url;
  const match = url.match(/catalog\/([^\/]+)/);
  if (!match) return;

  const folder = match[1].replace('%20', ' ');
  const category_id = folderToCategory[folder] || 2;

  if (!productsMap[item.product_id]) {
    productsMap[item.product_id] = { category_id, imageCount: 0 };
  }
  productsMap[item.product_id].imageCount++;
});

// 4. TEMPLATES ĐÃ BỔ SUNG ĐẦY ĐỦ CHO TẤT CẢ 12 CATEGORY (có styles cho mọi loại)
const templates = {
  1: { brands: ["Hòa Phát", "Erado", "Bella Home", "Đông Phương", "Kiên Cường", "Nội Thất 190"], materials: ["Gỗ óc chó", "Gỗ sồi", "Gỗ hương", "MDF"], colors: ["Nâu óc chó", "Trắng", "Xám", "Đen"], styles: ["Hiện đại", "Tân cổ điển", "Bắc Âu", "Indochine", "Tối giản"], sizes: ["1m6x2m", "1m8x2m", "2mx2m2", "Queen", "King"] },
  2: { brands: ["Divano", "Casa Bella", "Hoàng Gia", "Erado", "Fami"], materials: ["Da thật", "Nỉ nhung", "Vải bố"], colors: ["Xám", "Be", "Nâu", "Đen", "Trắng"], styles: ["Góc L", "Văng", "Bed", "Sang trọng", "Bắc Âu"], sizes: ["2m4", "2m8", "3m2"] },
  3: { brands: ["Capta", "Minh Thy", "Lux Home", "Hòa Phát"], materials: ["Gỗ sồi", "Da", "Nỉ"], colors: ["Trắng", "Xám", "Nâu", "Đen"], styles: ["Bắc Âu", "Tân cổ điển", "Cafe", "Thư giãn"] },
  4: { brands: ["Kifa", "Mỹ Nghệ Đại Phát", "Lux Table"], materials: ["Gỗ óc chó", "Kính", "Marble"], colors: ["Nâu", "Trắng", "Đen"], styles: ["Thông minh", "Hiện đại", "Bắc Âu"] },
  5: { brands: ["Philips", "Rạng Đông", "HT Lighting", "Panasonic"], materials: ["Thủy tinh", "Hợp kim", "Gỗ"], colors: ["Gold", "Trắng", "Đen", "Bạc"], styles: ["Hiện đại", "Cổ điển", "Công nghiệp", "Bắc Âu"] },
  6: { brands: ["Samsung", "LG", "Sony", "TCL", "Xiaomi"], materials: ["LED 4K", "QLED", "OLED"], colors: ["Đen"], styles: ["Thông minh", "Treo tường", "Để sàn"] },
  7: { brands: ["Apple", "Dell", "Asus", "MSI", "Lenovo", "HP"], materials: ["Nhôm", "Carbon"], colors: ["Silver", "Space Gray", "Đen"], styles: ["Ultrabook", "Gaming", "Văn phòng", "Đồ họa"] },
  8: { brands: ["Erado", "Hòa Phát", "An Cường", "Lux Wardrobe"], materials: ["MDF", "Gỗ óc chó", "Kính"], colors: ["Trắng", "Nâu", "Xám"], styles: ["Cánh lùa", "Cánh mở", "Âm tường", "Hiện đại"] },
  9: { brands: ["Xingfa", "Eurowindow", "Topal", "PMC"], materials: ["Nhôm kính", "Nhựa lõi thép"], colors: ["Trắng", "Xám", "Nâu"], styles: ["Hiện đại", "Cách âm", "Cách nhiệt", "An toàn"] },
  10: { brands: ["Austdoor", "BossDoor", "Samsung Door"], materials: ["Thép", "Gỗ tự nhiên"], colors: ["Nâu gỗ", "Trắng", "Xám"], styles: ["Hiện đại", "An toàn", "Cách âm", "Chống cháy"] },
  11: { brands: ["Green Decor", "Chậu Composite Lux"], materials: ["Nhựa", "Composite", "Gốm"], colors: ["Xanh lá"], styles: ["Trang trí", "Phong thủy", "Văn phòng", "Tối giản"] },
  12: { brands: ["Canvas Lux", "Gương Bỉ", "Tranh Decor"], materials: ["Canvas", "Gương", "Gỗ"], colors: ["Đa dạng"], styles: ["Hiện đại", "Tối giản", "Cổ điển", "Trừu tượng"] }
};

// 5. HÀM TẠO SẢN PHẨM AN TOÀN 100%
function generateProduct(product_id, category_id, imageCount) {
  const temp = templates[category_id] || templates[2]; // fallback sofa

  const brand = temp.brands[Math.floor(Math.random() * temp.brands.length)];
  const material = temp.materials[Math.floor(Math.random() * temp.materials.length)];
  const color = temp.colors[Math.floor(Math.random() * temp.colors.length)];
  const style = temp.styles[Math.floor(Math.random() * temp.styles.length)];
  const prefix = temp.namePrefix?.[Math.floor(Math.random() * (temp.namePrefix?.length || 3))] || "Sản phẩm";

  const sizeSuffix = temp.sizes ? ` ${temp.sizes[Math.floor(Math.random() * temp.sizes.length)]}` : '';

  const name = `${prefix} ${brand} ${style} ${material} ${color}${sizeSuffix} - Mã ${product_id}`.replace(/\s+/g, ' ').trim();

  const basePrice = category_id === 7 ? 18990000 : category_id === 6 ? 12990000 : category_id <= 2 ? 9990000 : 2990000;
  const price = Math.round((basePrice + Math.random() * 40000000 + imageCount * 2500000) / 100000) * 100000;

  const hasSale = Math.random() > 0.38;
  const sale_price = hasSale ? Math.round(price * (0.55 + Math.random() * 0.3) / 100000) * 100000 : null;
  const discount = hasSale ? Math.round(100 - (sale_price / price) * 100) : null;

  return {
    id: product_id,
    name,
    description: `${name}. Thiết kế ${style.toLowerCase()}, chất liệu ${material.toLowerCase()}, màu ${color.toLowerCase()}. Bảo hành chính hãng, miễn phí vận chuyển & lắp đặt nội thành Hà Nội/TP.HCM.`,
    price,
    sale_price,
    category_id,
    stock_quantity: Math.floor(Math.random() * 900) + 100,
    weight: Number((Math.random() * 200 + 10).toFixed(1)),
    length: Math.round(Math.random() * 220 + 40),
    width: Math.round(Math.random() * 160 + 30),
    height: Math.round(Math.random() * 230 + 20),
    material,
    color,
    status: "active",
    brand,
    style,
    discount,
    rating: Number((4.1 + Math.random() * 0.9).toFixed(1)),
    reviews: Math.floor(Math.random() * 1200),
    warranty: [6,7].includes(category_id) ? "Bảo hành chính hãng 2-3 năm" : "Bảo hành kết cấu 5-10 năm",
    shipping: "Miễn phí vận chuyển toàn quốc - Hỗ trợ lắp đặt tận nơi"
  };
}

// 6. TẠO PRODUCTS
const products = Object.entries(productsMap).map(([product_id, info]) => {
  return generateProduct(parseInt(product_id), info.category_id, info.imageCount);
});

products.sort((a, b) => a.id - b.id);

fs.writeFileSync('products.json', JSON.stringify(products, null, 2), 'utf-8');

console.log(`\n🎉 HOÀN TẤT! Đã tạo ${products.length} sản phẩm đẹp lung linh không lỗi`);
console.log(`   Từ ${productImages.length} ảnh thực tế`);
console.log(`   File: categories.json và products.json đã sẵn sàng seed Prisma!\n`);