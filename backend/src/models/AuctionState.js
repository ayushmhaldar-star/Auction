const mongoose = require('mongoose');

const auctionStateSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['IDLE', 'ACTIVE', 'PAUSED', 'SOLD', 'UNSOLD', 'COMPLETED'],
    default: 'IDLE'
  },
  currentPlayer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null
  },
  currentBid: {
    type: Number,
    default: 0
  },
  currentBiddingTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  currentIncrement: {
    type: Number,
    default: 100000
  },
  bidHistory: [{
    bidAmount: { type: Number, required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  currentRound: {
    type: Number,
    default: 1
  },
  isUnsoldRound: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('AuctionState', auctionStateSchema);
