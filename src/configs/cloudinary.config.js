require('dotenv').config();

// Cấu hình Cloudinary (Lấy từ .env của bạn)
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
};

module.exports = cloudinaryConfig;