const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { requireAdminAuth } = require('../middleware/auth');

router.get('/public', settingsController.getPublicSettings);
router.get('/', requireAdminAuth, settingsController.getSettings);
router.put('/', requireAdminAuth, settingsController.updateSettings);

module.exports = router;
