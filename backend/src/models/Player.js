const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  serialNumber: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  photo: {
    type: String,
    default: ''
  },
  age: {
    type: Number,
    required: true,
    min: 14,
    max: 60
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  battingStyle: {
    type: String,
    default: 'Right-hand bat'
  },
  bowlingStyle: {
    type: String,
    default: 'Right-arm medium'
  },
  previousTeam: {
    type: String,
    default: ''
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['PENDING', 'SOLD', 'UNSOLD'],
    default: 'PENDING'
  },
  soldPrice: {
    type: Number,
    default: 0
  },
  soldTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  auctionRound: {
    type: Number,
    default: 1
  },
  auctionAttempts: [{
    round: Number,
    finalBid: Number,
    status: {
      type: String,
      enum: ['SOLD', 'UNSOLD']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);
