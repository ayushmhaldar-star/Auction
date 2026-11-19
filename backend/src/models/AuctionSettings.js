const mongoose = require('mongoose');

const auctionSettingsSchema = new mongoose.Schema({
  websiteTitle: {
    type: String,
    default: 'AUCTION PRO'
  },
  auctionTitle: {
    type: String,
    default: 'Premier Sports League Auction 2026'
  },
  currencySymbol: {
    type: String,
    default: '₹'
  },
  defaultBudget: {
    type: Number,
    default: 100000000 // 10 Crores
  },
  defaultIncrement: {
    type: Number,
    default: 500000 // 5 Lakhs
  },
  auctionDate: {
    type: Date,
    default: Date.now
  },
  publicDisplayUrl: {
    type: String,
    default: '/live'
  }
}, { timestamps: true });

module.exports = mongoose.model('AuctionSettings', auctionSettingsSchema);
