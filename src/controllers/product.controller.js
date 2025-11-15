const { StatusCodes } = require("http-status-codes");
const productModel = require("../models/product.model");
// const { default: ApiError } = require("../utils/ApiError");
const ApiError = require("../utils/ApiError");
const { successResponse, errorResponse } = require("../utils/response");

const getAllProducts = async (req, res, next) => {
  try {
    let products;
    if (req.query.page && req.query.pageSize) {
      if (
        isNaN(parseInt(req.query.page)) ||
        isNaN(parseInt(req.query.pageSize))
      ) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Get products pagination failed",
          "Invalid page or pageSize"
        );
      }

      const page = parseInt(req.query.page);
      const pageSize = parseInt(req.query.pageSize);
      products = await productModel.getProductsPagination(page, pageSize);
    } else {
      products = await productModel.getAllProducts();
    }

    if (!products) {
      return errorResponse(res, "No any products", null, 404);
    }
    return successResponse(res, "Get all products success", products);
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    if (!req.params.id) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Get product failed",
        "Product ID is required"
      );
    }

    if (isNaN(parseInt(req.params.id))) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Get product failed",
        "Invalid product ID"
      );
    }

    const productId = parseInt(req.params.id);

    const product = await productModel.getProductById(productId);
    return successResponse(res, "Get product success", product);
  } catch (error) {
    next(error);
  }
};

const getAllCategories = async (req, res, next) => {
  try {
    const categories = await productModel.getAllCategories();
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

    const products = await productModel.SearchProducts(data);
    return successResponse(res, "Search products success", products);
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const data = req.body || [];
    console.log(data);
    data.price && (data.price = parseFloat(data.price));
    data.sale_price && (data.sale_price = parseFloat(data.sale_price));
    data.stock_quantity &&
      (data.stock_quantity = parseInt(data.stock_quantity));
    data.category_id && (data.category_id = parseInt(data.category_id));

    const imageFiles = req.files || [];

    data.image_url = imageFiles ? imageFiles.map((file) => file.path) : [];

    // data.image_url = JSON.stringify(data.image_url);

    const newProduct = await productModel.createProduct(data);
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

    const updatedProduct = await productModel.updateProduct(productId, data);
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
      const deletedProduct = await productModel.deleteProduct(productId);
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
};
