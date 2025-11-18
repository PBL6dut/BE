const express = require('express')
const router = express.Router()
const productController = require('../controllers/product.controller')
const upload = require('../utils/imageStorage');
const authMiddleware = require('../middlewares/auth.middleware')
const productValidate = require('../validations/product/product.validation');
const { validateGetProducts } = require('../validations/product/get-products.validation');

const requireAuth = authMiddleware.checkLogin
const validateCreateProduct = productValidate.validateCreateProduct
const validateUpdateProduct = productValidate.validateUpdateProduct
const productUpload = upload.productUpload

router.get('/', validateGetProducts, productController.getAllProducts);
router.get('/search', productController.SearchProducts);
router.get('/categories', productController.getAllCategories);
router.get('/:id', productController.getProductById);
// 'productUpload' middleware handles file uploads for product creation
router.use(requireAuth)
router.post('/', productUpload, validateCreateProduct, productController.createProduct);
router.put('/:id', productUpload, validateUpdateProduct, productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;