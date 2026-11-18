const AuctionSettings = require('../models/AuctionSettings');
const Team = require('../models/Team');

const getSettingsDoc = async () => {
  let settings = await AuctionSettings.findOne();
  if (!settings) {
    settings = await AuctionSettings.create({
      websiteTitle: 'AUCTION PRO',
      auctionTitle: 'AUCTION PRO – Premier League 2026',
      currencySymbol: '₹',
      defaultBudget: 100000000,
      defaultIncrement: 500000,
      auctionDate: new Date(),
      publicDisplayUrl: '/live'
    });
  } else if (settings.websiteTitle === 'Cricket Auction Pro') {
    settings.websiteTitle = 'AUCTION PRO';
    await settings.save();
  }
  return settings;
};

// Public endpoint for general settings (e.g. title, currency symbol)
exports.getPublicSettings = async (req, res) => {
  try {
    const settings = await getSettingsDoc();
    return res.json({
      success: true,
      settings: {
        websiteTitle: settings.websiteTitle,
        auctionTitle: settings.auctionTitle,
        currencySymbol: settings.currencySymbol,
        auctionDate: settings.auctionDate,
        publicDisplayUrl: settings.publicDisplayUrl
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch public settings.', error: error.message });
  }
};

// Admin endpoint for full settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await getSettingsDoc();
    const teams = await Team.find().select('name shortcutKey logo remainingBalance');

    return res.json({
      success: true,
      settings,
      teamShortcuts: teams.map(t => ({
        teamId: t._id,
        name: t.name,
        shortcutKey: t.shortcutKey,
        logo: t.logo,
        remainingBalance: t.remainingBalance
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch settings.', error: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const {
      websiteTitle,
      auctionTitle,
      currencySymbol,
      defaultBudget,
      defaultIncrement,
      auctionDate,
      publicDisplayUrl
    } = req.body;

    const settings = await getSettingsDoc();

    if (websiteTitle) settings.websiteTitle = websiteTitle.trim();
    if (auctionTitle) settings.auctionTitle = auctionTitle.trim();
    if (currencySymbol) settings.currencySymbol = currencySymbol.trim();
    if (defaultBudget !== undefined && !isNaN(Number(defaultBudget))) {
      settings.defaultBudget = Number(defaultBudget);
    }
    if (defaultIncrement !== undefined && !isNaN(Number(defaultIncrement))) {
      settings.defaultIncrement = Number(defaultIncrement);
    }
    if (auctionDate) settings.auctionDate = new Date(auctionDate);
    if (publicDisplayUrl) settings.publicDisplayUrl = publicDisplayUrl.trim();

    await settings.save();

    return res.json({
      success: true,
      message: 'Settings updated successfully.',
      settings
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update settings.', error: error.message });
  }
};
