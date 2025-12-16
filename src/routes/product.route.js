const express = require('express')
const router = express.Router()
const productController = require('../controllers/product.controller')
const upload = require('../utils/imageStorage');
const authMiddleware = require('../middlewares/auth.middleware')
const productValidate = require('../validators/product/product.validator');
const { validateGetProducts } = require('../validators/product/get-products.validator');
const { validatePaginationQuery } = require('../validators/pagination-query.validator');

const requireAuth = authMiddleware.checkLogin
const validateCreateProduct = productValidate.validateCreateProduct
const validateUpdateProduct = productValidate.validateUpdateProduct
const productUpload = upload.productUpload


router.get('/', validatePaginationQuery, productController.getAllProducts);
router.get('/count', productController.countProducts);
router.get('/search', productController.SearchProducts);
router.get('/categories', productController.getAllCategories);
router.get('/upload-signature', requireAuth, productController.getUploadSignarture);
router.get('/most-by-category', requireAuth, productController.getMostProductsByCategory);
router.get('/:id', productController.getProductById);
// 'productUpload' middleware handles file uploads for product creation
router.use(requireAuth)
router.post('/', productUpload, validateCreateProduct, productController.createProduct);
router.put('/:id', productUpload, validateUpdateProduct, productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;