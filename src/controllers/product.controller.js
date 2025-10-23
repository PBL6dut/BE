const productModel = require("../models/product.model");
const { successResponse, errorResponse } = require("../utils/response");

const getAllProducts = async (req, res) => {
  let products;
  try {
    if (req.query.page && req.query.pageSize) {
      const page = parseInt(req.query.page);
      const pageSize = parseInt(req.query.pageSize);
      console.log(page, pageSize);
      products = await productModel.getProductsPagination(page, pageSize);
    } else {
      products = await productModel.getAllProducts();
    }

    if (!products) {
      return errorResponse(res, "No any products", null, 404);
    }
    return successResponse(res, "Get all products success", products);
  } catch (error) {
    return errorResponse(res, "Get all products failed", error.message, 500);
  }
};

const getProductById = async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return errorResponse(res, "Invalid product ID", null, 400);
    }
    const product = await productModel.getProductById(productId);
    if (!product) {
      return errorResponse(res, "Product not found", null, 404);
    }
    return successResponse(res, "Get product success", product);
  } catch (error) {
    return errorResponse(res, "Get product failed", error.message, 500);
  }
};

const getAllCategories = async (req, res) => {
  try {
    const categories = await productModel.getAllCategories();
    if (!categories) {
      return errorResponse(res, "No categories found", null, 404);
    }
    return successResponse(res, "Get all categories success", categories);
  } catch (error) {
    return errorResponse(res, "Get all categories failed", error.message, 500);
  }
};

const SearchProducts = async (req, res) => {
  try {
    const data = req.query.name || {};
    if (!data) {
      return errorResponse(res, "No search parameters provided", null, 400);
    }
    // data.id && (data.id = parseInt(data.id));
    // data.price && (data.price = parseFloat(data.price));
    // data.sale_price && (data.sale_price = parseFloat(data.sale_price));
    // data.stock_quantity && (data.stock_quantity = parseInt(data.stock_quantity));
    // data.category_id && (data.category_id = parseInt(data.category_id));
  
    const products = await productModel.SearchProducts(data);
    if (!products) {
      return errorResponse(res, "No products found", null, 404);
    }
    return successResponse(res, "Search products success", products);
    
  } catch (error) {
    return errorResponse(res, "Search products failed", error.message, 500);
  }
};

const createProduct = async (req, res) => {
  try {
    const data = req.body || [];
    data.price && (data.price = parseFloat(data.price));
    data.sale_price && (data.sale_price = parseFloat(data.sale_price));
    data.stock_quantity && (data.stock_quantity = parseInt(data.stock_quantity));
    data.category_id && (data.category_id = parseInt(data.category_id));
  
    const imageFiles = req.files["image_url"] || [];
  
    data.image_url = imageFiles ? imageFiles.map((file) => file.path) : [];
  
    // data.image_url = JSON.stringify(data.image_url);
  
    const newProduct = await productModel.createProduct(data);
    return successResponse(res, "Product created successfully", newProduct, 201);
    
  } catch (error) {
    return errorResponse(res, "Product creation failed", error.message, 500);
  }
};

const updateProduct = async (req, res) => {
  console.log("req.files:", req.files);
  const productId = parseInt(req.params.id);
  const data = req.body || {};
  data.price && (data.price = parseFloat(data.price));
  data.sale_price && (data.sale_price = parseFloat(data.sale_price));
  data.stock_quantity && (data.stock_quantity = parseInt(data.stock_quantity));
  data.category_id && (data.category_id = parseInt(data.category_id));

  // Sửa dòng này để tránh lỗi khi req.files là undefined
  const imageFiles =
    req.files && req.files["image_url"] ? req.files["image_url"] : [];

  data.image_url = imageFiles ? imageFiles.map((file) => file.path) : [];

  const updatedProduct = await productModel.updateProduct(productId, data);
  return successResponse(res, "Product updated successfully", updatedProduct);
};

const deleteProduct = async (req, res) => {
  const productId = parseInt(req.params.id);
  const deletedProduct = await productModel.deleteProduct(productId);
  return successResponse(res, "Product deleted successfully", deletedProduct);
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
