const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auctionController');
const { requireAdminAuth } = require('../middleware/auth');

// Public route for projector / TV screen
router.get('/public-state', auctionController.getPublicState);

// Protected Admin routes
router.get('/admin-state', requireAdminAuth, auctionController.getAdminState);
router.get('/stats', requireAdminAuth, auctionController.getDashboardStats);
router.get('/history', requireAdminAuth, auctionController.getAuctionHistory);

router.post('/select-player', requireAdminAuth, auctionController.selectPlayer);
router.post('/navigate-player', requireAdminAuth, auctionController.navigatePlayer);
router.post('/bid', requireAdminAuth, auctionController.placeBid);
router.post('/undo-bid', requireAdminAuth, auctionController.undoBid);
router.post('/increment', requireAdminAuth, auctionController.setIncrement);
router.post('/pause', requireAdminAuth, auctionController.togglePause);
router.post('/sold', requireAdminAuth, auctionController.markSold);
router.post('/unsold', requireAdminAuth, auctionController.markUnsold);
router.post('/start-unsold-round', requireAdminAuth, auctionController.startUnsoldRound);
router.post('/reset', requireAdminAuth, auctionController.resetAuction);

module.exports = router;
