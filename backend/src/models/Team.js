const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  logo: {
    type: String,
    default: ''
  },
  initialBudget: {
    type: Number,
    required: true,
    min: 0
  },
  remainingBalance: {
    type: Number,
    required: true,
    min: 0
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  shortcutKey: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 1
  },
  purchasedPlayers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
