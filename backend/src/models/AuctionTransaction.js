const mongoose = require('mongoose');

const auctionTransactionSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  playerName: {
    type: String,
    required: true
  },
  playerSerialNumber: {
    type: Number,
    required: true
  },
  playerCategory: {
    type: String,
    required: true
  },
  basePrice: {
    type: Number,
    required: true
  },
  finalPrice: {
    type: Number,
    default: 0
  },
  winningTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  winningTeamName: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['SOLD', 'UNSOLD'],
    required: true
  },
  round: {
    type: Number,
    default: 1
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('AuctionTransaction', auctionTransactionSchema);
