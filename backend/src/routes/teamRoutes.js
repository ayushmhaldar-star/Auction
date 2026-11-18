const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { requireAdminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Teams can be fetched for display, modifications are strictly admin
router.get('/', teamController.getAllTeams);
router.get('/:id', teamController.getTeamById);
router.post('/', requireAdminAuth, upload.single('logo'), teamController.createTeam);
router.put('/:id', requireAdminAuth, upload.single('logo'), teamController.updateTeam);
router.delete('/:id', requireAdminAuth, teamController.deleteTeam);

module.exports = router;
