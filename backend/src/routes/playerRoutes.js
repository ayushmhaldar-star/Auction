const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');
const { requireAdminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', playerController.getAllPlayers);
router.get('/serial/:serialNumber', playerController.getPlayerBySerial);
router.get('/:id', playerController.getPlayerById);

// Admin-only mutations
router.post('/', requireAdminAuth, upload.single('photo'), playerController.createPlayer);
router.put('/:id', requireAdminAuth, upload.single('photo'), playerController.updatePlayer);
router.delete('/:id', requireAdminAuth, playerController.deletePlayer);
router.post('/import', requireAdminAuth, upload.single('file'), playerController.importPlayers);

module.exports = router;
