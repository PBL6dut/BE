const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chat.controller');

router.post('/', ChatController.chat);

module.exports = router;