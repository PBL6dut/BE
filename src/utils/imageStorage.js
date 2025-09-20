const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;

// Thiết lập Multer để xử lý tệp hình ảnh
const storage = (field) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, `public/uploads/${field}`); // Thư mục lưu trữ tệp hình ảnh (phải tạo sẵn)
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(
        null,
        file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
      );
    },
  });

// const upload = multer({ storage });
const userUpload = multer({ storage: storage("user") }).single("avatar");
const productUpload = multer({ storage: storage("product") }).fields([
  { name: "image_url", maxCount: 5 },
]);

// const upload = multer({ userStorage }).fields([
//   { name: 'avatar', maxCount: 1 },
//   // Thêm các trường khác nếu cần
// ]);

const deleteFile = async (filePath) => {
  try {
    // Kiểm tra file có tồn tại không
    await fs.access(filePath);
    // Xóa file
    await fs.unlink(filePath);
    console.log(`✅ Deleted: ${filePath}`);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log(`⚠️ File not found: ${filePath}`);
    } else {
      console.error(`❌ Error deleting: ${error.message}`);
    }
  }
};

module.exports = {
  userUpload,
  productUpload,
  deleteFile,
};
