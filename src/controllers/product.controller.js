const { StatusCodes } = require("http-status-codes");
const productservice = require("../services/product.service");
const { default: ApiError } = require("../utils/ApiError");
const { successResponse, errorResponse } = require("../utils/response");
const cloudinaryConfig = require("../configs/cloudinary.config");
const cloudinary = require('cloudinary').v2;
// require('dotenv').config();

cloudinary.config(cloudinaryConfig);

const countProducts = async (req, res, next) => {
  try {
    const count = await productservice.countProducts();
    return successResponse(res, "Count products success", count, StatusCodes.OK);
  } catch (error) {
    next(error);
  }
}

const getAllProducts = async (req, res, next) => {
  try {
    const { page: pageStr, pageSize: pageSizeStr, ...rest } = req.query;
    let page = pageStr ? parseInt(pageStr, 10) : 1;
    let limit = pageSizeStr ? parseInt(pageSizeStr, 10) : 10;

    const result = await productservice.getAllProducts(page, limit, rest);

    if (!result.data || result.data.length === 0) {
      return successResponse(res, "No products found", [], StatusCodes.OK);
    }

    return successResponse(res, "Get all products success", result);
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id);
    const product = await productservice.getProductById(productId);
    return successResponse(res, "Get product success", product);
  } catch (error) {
    next(error);
  }
};

const getAllCategories = async (req, res, next) => {
  try {
    const categories = await productservice.getAllCategories();
    
    if (!categories || categories.length === 0) {
      return successResponse(res, "No categories found", [], StatusCodes.OK);
    }

    return successResponse(res, "Get all categories success", categories);
  } catch (error) {
    next(error);
  }
};

const SearchProducts = async (req, res, next) => {
  try {
    const data = req.query.name || {};
    // data.id && (data.id = parseInt(data.id));
    // data.price && (data.price = parseFloat(data.price));
    // data.sale_price && (data.sale_price = parseFloat(data.sale_price));
    // data.stock_quantity && (data.stock_quantity = parseInt(data.stock_quantity));
    // data.category_id && (data.category_id = parseInt(data.category_id));

    const products = await productservice.SearchProducts(data);
    return successResponse(res, "Search products success", products);
  } catch (error) {
    next(error);
  }
};

const getUploadSignarture = (req, res, next) => {
  try {
    // 1. Tạo timestamp (thời gian hiện tại tính bằng giây)
    const timestamp = Math.round((new Date).getTime() / 1000);

    // 2. Định nghĩa các quy tắc upload (Params to sign)
    // Những tham số nào bạn khai báo ở đây thì FE BẮT BUỘC phải gửi đúng y hệt
    const uploadConfig = {
      timestamp: timestamp,
      folder: 'catalog', // Gom hết ảnh vào thư mục catalog như bạn muốn
      // use_filename: true, // Nếu muốn giữ tên file gốc (tùy chọn)
      // unique_filename: false, // Nếu muốn ghi đè file cũ cùng tên (tùy chọn)
    };

    // 3. Tạo chữ ký bí mật dựa trên uploadConfig và API_SECRET
    const signature = cloudinary.utils.api_sign_request(
      uploadConfig,
      process.env.CLOUDINARY_API_SECRET
    );

    // 4. Trả về cho Frontend
    return successResponse(res, "Get upload signature success", {
      timestamp,
      signature,
      folder: uploadConfig.folder,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY
    });

  } catch (error) {
    next(error);
  }
}

const createProduct = async (req, res, next) => {
  try {
    const data = req.body || [];
    data.price && (data.price = parseFloat(data.price));
    data.sale_price && (data.sale_price = parseFloat(data.sale_price));
    data.stock_quantity &&
      (data.stock_quantity = parseInt(data.stock_quantity));
    data.category_id && (data.category_id = parseInt(data.category_id));

    const imageFiles = req.files || [];

    data.image_url = imageFiles ? imageFiles.map((file) => file.path) : [];

    // data.image_url = JSON.stringify(data.image_url);

    const newProduct = await productservice.createProduct(data);
    return successResponse(
      res,
      "Product created successfully",
      newProduct,
      201
    );
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    if (!req.params) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Update product failed",
        "Product ID is required"
      );
    }

    if (isNaN(parseInt(req.params.id))) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Update product failed",
        "Invalid product ID"
      );
    }

    const productId = parseInt(req.params.id);

    const data = req.body || {};
    if (
      Object.keys(data).length === 0 &&
      (!req.files || Object.keys(req.files).length === 0)
    ) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Update product failed",
        "No data provided"
      );
    }

    data.price && (data.price = parseFloat(data.price));
    data.sale_price && (data.sale_price = parseFloat(data.sale_price));
    data.stock_quantity &&
      (data.stock_quantity = parseInt(data.stock_quantity));
    data.category_id && (data.category_id = parseInt(data.category_id));

    // Sửa dòng này để tránh lỗi khi req.files là undefined
    const imageFiles = req.files || []
    console.log(imageFiles)

    data.image_url = imageFiles ? imageFiles.map((file) => file.path) : [];

    const updatedProduct = await productservice.updateProduct(productId, data);
    return successResponse(res, "Product updated successfully", updatedProduct);
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    if (!req.params.id) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Delete product failed",
        "Product ID is required"
      );
    } else {
      if (isNaN(parseInt(req.params.id))) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Delete product failed",
          "Invalid product ID"
        );
      }

      const productId = parseInt(req.params.id);
      const deletedProduct = await productservice.deleteProduct(productId);
      return successResponse(
        res,
        "Product deleted successfully",
        deletedProduct
      );
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  SearchProducts,
  getAllCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  countProducts,
  getUploadSignarture,
};
