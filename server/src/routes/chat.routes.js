const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All chat endpoints require authenticated session
router.use(authenticate);

router.post('/message', chatController.sendMessage);
router.get('/suggestions', chatController.getSuggestions);
router.get('/quick-stats', chatController.getQuickStats);

module.exports = router;
