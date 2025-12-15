const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const cloudinaryConfig = require("../configs/cloudinary.config");

// Cấu hình Cloudinary
cloudinary.config(cloudinaryConfig);

// Sử dụng memoryStorage để lưu file vào memory thay vì disk
const storage = multer.memoryStorage();

// Helper function để upload buffer lên Cloudinary
const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(buffer);
  });
};

// Middleware để upload file lên Cloudinary sau khi multer xử lý
const cloudinaryUploadMiddleware = (folder) => async (req, res, next) => {
  try {
    if (!req.file && !req.files) {
      return next();
    }

    // Xử lý single file (cho user avatar)
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, folder);
      req.file.path = result.secure_url;
      req.file.cloudinary_id = result.public_id;
    }

    // Xử lý multiple files (cho product images)
    if (req.files && Array.isArray(req.files)) {
      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.buffer, folder)
      );
      const results = await Promise.all(uploadPromises);

      req.files.forEach((file, index) => {
        file.path = results[index].secure_url;
        file.cloudinary_id = results[index].public_id;
      });
    }

    next();
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error);
    next(error);
  }
};

// Multer upload với memory storage
const userUploadMulter = multer({ storage }).single("avatar");
const productUploadMulter = multer({ storage }).array("image_url", 5);

// Combined middleware: multer + cloudinary upload
const userUpload = [
  userUploadMulter,
  cloudinaryUploadMiddleware("users"),
];

const productUpload = [
  productUploadMulter,
  cloudinaryUploadMiddleware("catalog"),
];

// Hàm xóa file trên Cloudinary
const deleteFile = async (filePathOrPublicId) => {
  try {
    // Nếu là URL Cloudinary, extract public_id
    let publicId = filePathOrPublicId;

    if (filePathOrPublicId.includes("cloudinary.com")) {
      // Extract public_id from URL
      // Example URL: https://res.cloudinary.com/dxwxoeigb/image/upload/v1234567890/catalog/image-123.jpg
      const urlParts = filePathOrPublicId.split("/upload/");
      if (urlParts.length > 1) {
        // Lấy phần sau "/upload/" và remove version number (vXXXXXXXXX/)
        publicId = urlParts[1].replace(/^v\d+\//, "");
        // Remove file extension
        publicId = publicId.replace(/\.[^.]+$/, "");
      }
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "ok") {
      console.log(`✅ Deleted from Cloudinary: ${publicId}`);
    } else if (result.result === "not found") {
      console.log(`⚠️ File not found on Cloudinary: ${publicId}`);
    } else {
      console.log(`⚠️ Cloudinary delete result: ${result.result}`);
    }

    return result;
  } catch (error) {
    console.error(`❌ Error deleting from Cloudinary: ${error.message}`);
    throw error;
  }
};

module.exports = {
  userUpload,
  productUpload,
  deleteFile,
};
