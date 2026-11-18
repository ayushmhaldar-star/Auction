const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { requireAdminAuth } = require('../middleware/auth');

router.get('/', categoryController.getAllCategories);
router.get('/:id/players', requireAdminAuth, categoryController.getCategoryPlayers);
router.post('/', requireAdminAuth, categoryController.createCategory);
router.put('/:id', requireAdminAuth, categoryController.updateCategory);
router.delete('/:id', requireAdminAuth, categoryController.deleteCategory);

module.exports = router;
