const express = require('express');
const multer = require('multer');
const { checkLogin } = require('../middlewares/auth.middleware');
const aiController = require('../controllers/ai.controller');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024  // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'), false);
    }
  }
});

// All routes require JWT authentication
router.use(checkLogin);

// AI endpoints
router.post('/detect', upload.single('file'), aiController.detectObjects);
router.post('/:session_id', aiController.getRecommendations);
router.get('/history/me', aiController.getHistory);
router.delete('/history/clear', aiController.clearHistory);

module.exports = router;
