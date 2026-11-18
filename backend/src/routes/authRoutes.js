const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAdminAuth } = require('../middleware/auth');

router.post('/login', authController.login);
router.get('/me', requireAdminAuth, authController.getMe);
router.post('/change-password', requireAdminAuth, authController.changePassword);

module.exports = router;
