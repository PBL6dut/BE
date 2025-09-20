const productModel = require("../models/product.model");
const productValidate = require("../validations/product.validation");

const getAllProducts = async (req, res) => {
  const products = await productModel.getAllProducts();
  products.forEach((product) => {
    product.images = product.images.map((image) =>
      image.url.replace(/\\/g, "/")
    );
  });
  res.json(products);
};

const getProductById = async (req, res) => {
  const productId = parseInt(req.params.id);
  const product = await productModel.getProductById(productId);
  product && (product.images = product.images.map((image) => image.url.replace(/\\/g, "/")));
  res.json(product);
};

const getAllCategories = async (req, res) => {
  const categories = await productModel.getAllCategories();
  res.json(categories);
};

const SearchProducts = async (req, res) => {
  const data = req.body || {};
  data.id && (data.id = parseInt(data.id));
  data.price && (data.price = parseFloat(data.price));
  data.sale_price && (data.sale_price = parseFloat(data.sale_price));
  data.stock_quantity && (data.stock_quantity = parseInt(data.stock_quantity));
  data.category_id && (data.category_id = parseInt(data.category_id));
  
  const products = await productModel.SearchProducts(data);
  products.forEach((product) => {
    product.images = product.images.map((image) =>
      image.url.replace(/\\/g, "/")
    );
  });
  res.json(products);
};

const createProduct = async (req, res) => {
  const data = req.body || [];
  data.price && (data.price = parseFloat(data.price));
  data.sale_price && (data.sale_price = parseFloat(data.sale_price));
  data.stock_quantity && (data.stock_quantity = parseInt(data.stock_quantity));
  data.category_id && (data.category_id = parseInt(data.category_id));

  const imageFiles = req.files["image_url"] || [];

  data.image_url = imageFiles ? imageFiles.map((file) => file.path) : [];

  // data.image_url = JSON.stringify(data.image_url);

  const newProduct = await productModel.createProduct(data);
  res.status(201).json(newProduct);
};

const updateProduct = async (req, res) => {
  console.log("req.files:", req.files);
  const productId = parseInt(req.params.id);
  const data = req.body || {};

  // Sửa dòng này để tránh lỗi khi req.files là undefined
  const imageFiles =
    req.files && req.files["image_url"] ? req.files["image_url"] : [];


  data.image_url = imageFiles ? imageFiles.map((file) => file.path) : [];

  const updatedProduct = await productModel.updateProduct(productId, data);
  res.status(200).json(updatedProduct);
};

const deleteProduct = async (req, res) => {
  const productId = parseInt(req.params.id);
  const deletedProduct = await productModel.deleteProduct(productId);
  res.status(200).json({ message: "Product deleted successfully" });
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
