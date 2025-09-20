const express = require('express')
const router = express.Router()
const productController = require('../controllers/product.controller')
const upload = require('../utils/imageStorage');
const authMiddleware = require('../middlewares/auth.middleware')
const productValidate = require('../validations/product.validation')

const requireAuth = authMiddleware.checkLogin
const validateCreateProduct = productValidate.validateCreateProduct
const validateUpdateProduct = productValidate.validateUpdateProduct
const productUpload = upload.productUpload

router.get('/list', productController.getAllProducts);
router.get('/detail/:id', productController.getProductById);
router.get('/search', productController.SearchProducts);
router.get('/categories/list', productController.getAllCategories);
// 'productUpload' middleware handles file uploads for product creation
router.use(requireAuth)
router.post('/create', productUpload, validateCreateProduct, productController.createProduct);
router.put('/update/:id', productUpload, validateUpdateProduct, productController.updateProduct);
router.delete('/delete/:id', productController.deleteProduct);

module.exports = router;