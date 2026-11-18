const AuctionState = require('../models/AuctionState');
const AuctionTransaction = require('../models/AuctionTransaction');
const Player = require('../models/Player');
const Team = require('../models/Team');
const Category = require('../models/Category');
const AuctionSettings = require('../models/AuctionSettings');
const { broadcastAuctionState, emitSoldEvent, emitUnsoldEvent } = require('../sockets/auctionSocket');
const { sanitizeForPublic } = require('../utils/sanitize');
const xlsx = require('xlsx');

// Ensure singleton auction state exists
const getOrCreateState = async () => {
  let state = await AuctionState.findOne()
    .populate({
      path: 'currentPlayer',
      populate: { path: 'category', select: 'name' }
    })
    .populate('currentBiddingTeam')
    .populate({
      path: 'bidHistory.team',
      select: 'name logo shortcutKey remainingBalance'
    });

  if (!state) {
    const defaultSettings = await AuctionSettings.findOne() || await AuctionSettings.create({});
    state = await AuctionState.create({
      status: 'IDLE',
      currentIncrement: defaultSettings.defaultIncrement || 100000,
      currentRound: 1,
      isUnsoldRound: false
    });
    state = await AuctionState.findById(state._id)
      .populate({
        path: 'currentPlayer',
        populate: { path: 'category', select: 'name' }
      })
      .populate('currentBiddingTeam');
  }

  return state;
};

exports.getAdminState = async (req, res) => {
  try {
    const state = await getOrCreateState();
    return res.json({ success: true, state });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch auction state.', error: error.message });
  }
};

exports.getPublicState = async (req, res) => {
  try {
    const state = await getOrCreateState();
    const publicData = sanitizeForPublic(state);
    return res.json({ success: true, state: publicData });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch public auction state.', error: error.message });
  }
};

exports.selectPlayer = async (req, res) => {
  try {
    const { playerId, serialNumber } = req.body;

    let player = null;
    if (serialNumber !== undefined && serialNumber !== null && serialNumber !== '') {
      player = await Player.findOne({ serialNumber: Number(serialNumber) }).populate('category', 'name');
    } else if (playerId) {
      player = await Player.findById(playerId).populate('category', 'name');
    }

    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found with the provided details.' });
    }

    const state = await getOrCreateState();

    state.currentPlayer = player._id;
    state.currentBid = player.basePrice;
    state.currentBiddingTeam = null;
    state.bidHistory = [];
    state.status = 'ACTIVE';

    await state.save();

    const populatedState = await getOrCreateState();
    broadcastAuctionState(populatedState);

    return res.json({
      success: true,
      message: `Player #${player.serialNumber} - ${player.name} selected for bidding.`,
      state: populatedState
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to select player.', error: error.message });
  }
};

exports.navigatePlayer = async (req, res) => {
  try {
    const { direction = 'next', categoryId } = req.body;
    const state = await getOrCreateState();

    const query = { status: 'PENDING' };
    if (categoryId) query.category = categoryId;

    let targetPlayer;
    if (state.currentPlayer) {
      const currentSerial = state.currentPlayer.serialNumber;
      if (direction === 'next') {
        targetPlayer = await Player.findOne({
          ...query,
          serialNumber: { $gt: currentSerial }
        }).sort({ serialNumber: 1 }).populate('category', 'name');
      } else {
        targetPlayer = await Player.findOne({
          ...query,
          serialNumber: { $lt: currentSerial }
        }).sort({ serialNumber: -1 }).populate('category', 'name');
      }
    }

    // Wrap around or pick first pending player if none found
    if (!targetPlayer) {
      targetPlayer = await Player.findOne(query).sort({ serialNumber: 1 }).populate('category', 'name');
    }

    if (!targetPlayer) {
      return res.status(404).json({ success: false, message: 'No more pending players found in this category/round.' });
    }

    state.currentPlayer = targetPlayer._id;
    state.currentBid = targetPlayer.basePrice;
    state.currentBiddingTeam = null;
    state.bidHistory = [];
    state.status = 'ACTIVE';

    await state.save();

    const populatedState = await getOrCreateState();
    broadcastAuctionState(populatedState);

    return res.json({
      success: true,
      state: populatedState
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to navigate player.', error: error.message });
  }
};

exports.placeBid = async (req, res) => {
  try {
    const { teamId, shortcutKey, customAmount, incrementOnly } = req.body;

    const state = await getOrCreateState();

    if (state.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `Cannot place bid while auction is ${state.status}. Please resume or select a player.`
      });
    }

    if (!state.currentPlayer) {
      return res.status(400).json({ success: false, message: 'No player is currently on the auction block.' });
    }

    // Find team either by teamId or keyboard shortcut
    let team = null;
    if (shortcutKey) {
      team = await Team.findOne({ shortcutKey: shortcutKey.toUpperCase().trim() });
    } else if (teamId) {
      team = await Team.findById(teamId);
    }

    if (!team) {
      return res.status(404).json({ success: false, message: 'Specified team not found.' });
    }

    let newBid;
    if (customAmount !== undefined && customAmount !== null && customAmount !== '') {
      newBid = Number(customAmount);
      if (isNaN(newBid)) {
        return res.status(400).json({ success: false, message: 'Invalid custom bid amount.' });
      }
    } else {
      // If no bids placed yet, first bid can be basePrice or basePrice + increment
      if (!state.currentBiddingTeam && state.bidHistory.length === 0) {
        newBid = incrementOnly ? state.currentBid + state.currentIncrement : state.currentBid;
      } else {
        newBid = state.currentBid + state.currentIncrement;
      }
    }

    // Rule: Never allow bid below base price
    if (newBid < state.currentPlayer.basePrice) {
      return res.status(400).json({
        success: false,
        message: `Bid amount must be at least the base price of ${state.currentPlayer.basePrice}.`
      });
    }

    // Rule: If already has bids, new bid must be greater than current bid
    if (state.currentBiddingTeam && newBid <= state.currentBid) {
      return res.status(400).json({
        success: false,
        message: `New bid (${newBid}) must be strictly higher than current bid (${state.currentBid}).`
      });
    }

    // Rule: Team balance check - Never allow remaining balance to become negative!
    if (newBid > team.remainingBalance) {
      return res.status(400).json({
        success: false,
        message: `Team "${team.name}" has insufficient funds! Remaining balance: ${team.remainingBalance}, Attempted bid: ${newBid}.`
      });
    }

    // Record bid in history
    state.bidHistory.push({
      bidAmount: newBid,
      team: team._id,
      timestamp: new Date()
    });

    state.currentBid = newBid;
    state.currentBiddingTeam = team._id;

    await state.save();

    const populatedState = await getOrCreateState();
    broadcastAuctionState(populatedState);

    return res.json({
      success: true,
      message: `Bid placed: ${newBid} by ${team.name}`,
      state: populatedState
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to place bid.', error: error.message });
  }
};

exports.undoBid = async (req, res) => {
  try {
    const state = await getOrCreateState();

    if (!state.bidHistory || state.bidHistory.length === 0) {
      return res.status(400).json({ success: false, message: 'No bids to undo for the current player.' });
    }

    // Pop the latest bid
    state.bidHistory.pop();

    if (state.bidHistory.length > 0) {
      const prevBid = state.bidHistory[state.bidHistory.length - 1];
      state.currentBid = prevBid.bidAmount;
      state.currentBiddingTeam = prevBid.team;
    } else {
      // Reset back to base price and no team
      state.currentBid = state.currentPlayer ? state.currentPlayer.basePrice : 0;
      state.currentBiddingTeam = null;
    }

    await state.save();

    const populatedState = await getOrCreateState();
    broadcastAuctionState(populatedState);

    return res.json({
      success: true,
      message: 'Last bid undone successfully.',
      state: populatedState
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to undo bid.', error: error.message });
  }
};

exports.setIncrement = async (req, res) => {
  try {
    const { increment } = req.body;
    const incNum = Number(increment);
    if (isNaN(incNum) || incNum <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive increment is required.' });
    }

    const state = await getOrCreateState();
    state.currentIncrement = incNum;
    await state.save();

    const populatedState = await getOrCreateState();
    broadcastAuctionState(populatedState);

    return res.json({
      success: true,
      message: `Bidding increment set to ${incNum}.`,
      state: populatedState
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update increment.', error: error.message });
  }
};

exports.togglePause = async (req, res) => {
  try {
    const state = await getOrCreateState();
    if (state.status === 'ACTIVE') {
      state.status = 'PAUSED';
    } else if (state.status === 'PAUSED') {
      state.status = 'ACTIVE';
    } else {
      return res.status(400).json({ success: false, message: `Cannot pause/resume when auction is ${state.status}.` });
    }

    await state.save();

    const populatedState = await getOrCreateState();
    broadcastAuctionState(populatedState);

    return res.json({
      success: true,
      message: `Auction is now ${state.status}.`,
      state: populatedState
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to toggle pause.', error: error.message });
  }
};

exports.markSold = async (req, res) => {
  try {
    const state = await getOrCreateState();

    if (!state.currentPlayer) {
      return res.status(400).json({ success: false, message: 'No player selected to mark as SOLD.' });
    }

    if (!state.currentBiddingTeam) {
      return res.status(400).json({
        success: false,
        message: 'Cannot mark as SOLD! No team has placed a bid on this player yet.'
      });
    }

    const player = await Player.findById(state.currentPlayer._id).populate('category', 'name');
    const team = await Team.findById(state.currentBiddingTeam._id || state.currentBiddingTeam);

    if (!player || !team) {
      return res.status(404).json({ success: false, message: 'Player or winning team record missing.' });
    }

    if (player.status === 'SOLD') {
      return res.status(400).json({ success: false, message: 'Player is already marked as SOLD.' });
    }

    const finalAmount = state.currentBid;

    // Validate budget one more time before deduction
    if (team.remainingBalance < finalAmount) {
      return res.status(400).json({
        success: false,
        message: `Winning team has insufficient balance (${team.remainingBalance}) for final bid (${finalAmount}).`
      });
    }

    // Deduct money & update team
    team.remainingBalance -= finalAmount;
    team.totalSpent += finalAmount;
    team.purchasedPlayers.push(player._id);
    await team.save();

    // Update player
    player.status = 'SOLD';
    player.soldPrice = finalAmount;
    player.soldTo = team._id;
    player.auctionRound = state.currentRound;
    player.auctionAttempts.push({
      round: state.currentRound,
      finalBid: finalAmount,
      status: 'SOLD',
      timestamp: new Date()
    });
    await player.save();

    // Create transaction audit record
    await AuctionTransaction.create({
      player: player._id,
      playerName: player.name,
      playerSerialNumber: player.serialNumber,
      playerCategory: player.category?.name || 'Unassigned',
      basePrice: player.basePrice,
      finalPrice: finalAmount,
      winningTeam: team._id,
      winningTeamName: team.name,
      status: 'SOLD',
      round: state.currentRound,
      timestamp: new Date()
    });

    state.status = 'SOLD';
    await state.save();

    const populatedState = await getOrCreateState();

    // Emit celebration event & broadcast state
    emitSoldEvent({
      player,
      team,
      soldPrice: finalAmount
    });
    broadcastAuctionState(populatedState);

    return res.json({
      success: true,
      message: `${player.name} SOLD to ${team.name} for ${finalAmount}!`,
      state: populatedState,
      soldData: {
        player,
        team,
        soldPrice: finalAmount
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to mark player as SOLD.', error: error.message });
  }
};

exports.markUnsold = async (req, res) => {
  try {
    const state = await getOrCreateState();

    if (!state.currentPlayer) {
      return res.status(400).json({ success: false, message: 'No player selected to mark as UNSOLD.' });
    }

    const player = await Player.findById(state.currentPlayer._id).populate('category', 'name');
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player record missing.' });
    }

    if (player.status === 'SOLD') {
      return res.status(400).json({ success: false, message: 'A sold player cannot be marked as UNSOLD.' });
    }

    // Update player to UNSOLD - NEVER deduct money from any team
    player.status = 'UNSOLD';
    player.soldPrice = 0;
    player.soldTo = null;
    player.auctionAttempts.push({
      round: state.currentRound,
      finalBid: state.currentBid,
      status: 'UNSOLD',
      timestamp: new Date()
    });
    await player.save();

    // Create transaction audit record
    await AuctionTransaction.create({
      player: player._id,
      playerName: player.name,
      playerSerialNumber: player.serialNumber,
      playerCategory: player.category?.name || 'Unassigned',
      basePrice: player.basePrice,
      finalPrice: 0,
      winningTeam: null,
      winningTeamName: null,
      status: 'UNSOLD',
      round: state.currentRound,
      timestamp: new Date()
    });

    state.status = 'UNSOLD';
    state.currentBiddingTeam = null;
    await state.save();

    const populatedState = await getOrCreateState();

    emitUnsoldEvent({ player });
    broadcastAuctionState(populatedState);

    return res.json({
      success: true,
      message: `${player.name} marked as UNSOLD.`,
      state: populatedState
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to mark player as UNSOLD.', error: error.message });
  }
};

exports.startUnsoldRound = async (req, res) => {
  try {
    const state = await getOrCreateState();

    // Check count of unsold players
    const unsoldPlayers = await Player.find({ status: 'UNSOLD' });
    if (unsoldPlayers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No unsold players available to start an unsold round.'
      });
    }

    // Increment round
    const nextRound = (state.currentRound || 1) + 1;

    // Reset unsold players back to PENDING for the new round without duplicating records
    await Player.updateMany(
      { status: 'UNSOLD' },
      { $set: { status: 'PENDING', auctionRound: nextRound } }
    );

    state.currentRound = nextRound;
    state.isUnsoldRound = true;
    state.status = 'IDLE';
    state.currentPlayer = null;
    state.currentBid = 0;
    state.currentBiddingTeam = null;
    state.bidHistory = [];

    await state.save();

    const populatedState = await getOrCreateState();
    broadcastAuctionState(populatedState);

    return res.json({
      success: true,
      message: `Unsold Round ${nextRound} started with ${unsoldPlayers.length} players!`,
      state: populatedState,
      playerCount: unsoldPlayers.length
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to start unsold round.', error: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const totalPlayers = await Player.countDocuments();
    const totalTeams = await Team.countDocuments();
    const playersSold = await Player.countDocuments({ status: 'SOLD' });
    const playersUnsold = await Player.countDocuments({ status: 'UNSOLD' });
    const remainingPlayers = await Player.countDocuments({ status: 'PENDING' });

    // Calculate total spent across all teams
    const teams = await Team.find();
    const totalAuctionAmount = teams.reduce((acc, t) => acc + (t.totalSpent || 0), 0);

    const state = await getOrCreateState();

    const recentActivity = await AuctionTransaction.find()
      .sort({ timestamp: -1 })
      .limit(8)
      .populate('player', 'photo');

    return res.json({
      success: true,
      stats: {
        totalPlayers,
        totalTeams,
        playersSold,
        playersUnsold,
        remainingPlayers,
        totalAuctionAmount,
        currentAuctionStatus: state.status,
        currentRound: state.currentRound,
        isUnsoldRound: state.isUnsoldRound,
        recentActivity
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats.', error: error.message });
  }
};

exports.getAuctionHistory = async (req, res) => {
  try {
    const { teamId, status, round, category, exportFormat } = req.query;

    const query = {};
    if (teamId) query.winningTeam = teamId;
    if (status) query.status = status;
    if (round) query.round = Number(round);
    if (category) query.playerCategory = category;

    const transactions = await AuctionTransaction.find(query)
      .populate('player', 'serialNumber photo age battingStyle bowlingStyle')
      .populate('winningTeam', 'name logo')
      .sort({ timestamp: -1 });

    if (exportFormat === 'csv' || exportFormat === 'xlsx') {
      const dataRows = transactions.map((t) => ({
        'Serial No': t.playerSerialNumber,
        'Player Name': t.playerName,
        'Category': t.playerCategory,
        'Base Price': t.basePrice,
        'Final Price': t.finalPrice,
        'Status': t.status,
        'Winning Team': t.winningTeamName || 'N/A',
        'Auction Round': t.round,
        'Date & Time': new Date(t.timestamp).toLocaleString()
      }));

      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet(dataRows);
      xlsx.utils.book_append_sheet(wb, ws, 'Auction History');

      const buffer = xlsx.write(wb, { type: 'buffer', bookType: exportFormat === 'csv' ? 'csv' : 'xlsx' });
      const contentType = exportFormat === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      res.setHeader('Content-Disposition', `attachment; filename="auction_history_${Date.now()}.${exportFormat}"`);
      res.setHeader('Content-Type', contentType);
      return res.send(buffer);
    }

    return res.json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch auction history.', error: error.message });
  }
};

exports.resetAuction = async (req, res) => {
  try {
    // Reset all players to PENDING
    await Player.updateMany({}, {
      $set: {
        status: 'PENDING',
        soldPrice: 0,
        soldTo: null,
        auctionRound: 1,
        auctionAttempts: []
      }
    });

    // Reset all teams' budgets
    const teams = await Team.find();
    for (const t of teams) {
      t.remainingBalance = t.initialBudget;
      t.totalSpent = 0;
      t.purchasedPlayers = [];
      await t.save();
    }

    // Clear transactions
    await AuctionTransaction.deleteMany({});

    // Reset auction state
    const state = await getOrCreateState();
    state.status = 'IDLE';
    state.currentPlayer = null;
    state.currentBid = 0;
    state.currentBiddingTeam = null;
    state.bidHistory = [];
    state.currentRound = 1;
    state.isUnsoldRound = false;
    await state.save();

    const populatedState = await getOrCreateState();
    broadcastAuctionState(populatedState);

    return res.json({
      success: true,
      message: 'Auction has been completely reset to initial state.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to reset auction.', error: error.message });
  }
};
