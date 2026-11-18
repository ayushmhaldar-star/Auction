const Admin = require('../models/Admin');
const Category = require('../models/Category');
const Team = require('../models/Team');
const Player = require('../models/Player');
const AuctionSettings = require('../models/AuctionSettings');
const AuctionState = require('../models/AuctionState');

const seedInitialData = async () => {
  try {
    // 1. Admin Account
    const existingAdmin = await Admin.findOne();
    if (!existingAdmin) {
      const username = process.env.ADMIN_USERNAME || 'admin';
      const password = process.env.ADMIN_PASSWORD || 'admin123';
      const admin = new Admin({ username, password });
      await admin.save();
      console.log(`[Seed] Default Admin account created: username="${username}" password="${password}"`);
    }

    // 2. Default Categories
    const categoriesCount = await Category.countDocuments();
    let catBatsman, catBowler, catAllRounder, catWK;
    if (categoriesCount === 0) {
      catBatsman = await Category.create({ name: 'Batsman', description: 'Top order and middle order batsmen', displayOrder: 1 });
      catBowler = await Category.create({ name: 'Bowler', description: 'Fast bowlers and spinners', displayOrder: 2 });
      catAllRounder = await Category.create({ name: 'All-Rounder', description: 'Players adept at batting and bowling', displayOrder: 3 });
      catWK = await Category.create({ name: 'Wicket Keeper', description: 'Wicket keepers and keeper-batsmen', displayOrder: 4 });
      console.log('[Seed] Default categories created: Batsman, Bowler, All-Rounder, Wicket Keeper');
    } else {
      catBatsman = await Category.findOne({ name: 'Batsman' });
      catBowler = await Category.findOne({ name: 'Bowler' });
      catAllRounder = await Category.findOne({ name: 'All-Rounder' });
      catWK = await Category.findOne({ name: 'Wicket Keeper' });
    }

    // 3. Default Teams with unique Keyboard Shortcuts
    const teamsCount = await Team.countDocuments();
    if (teamsCount === 0) {
      const teamsToCreate = [
        {
          name: 'Mumbai Strikers',
          logo: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=200&q=80',
          initialBudget: 100000000,
          remainingBalance: 100000000,
          totalSpent: 0,
          shortcutKey: 'Q'
        },
        {
          name: 'Chennai Warriors',
          logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=200&q=80',
          initialBudget: 100000000,
          remainingBalance: 100000000,
          totalSpent: 0,
          shortcutKey: 'W'
        },
        {
          name: 'Bangalore Blasters',
          logo: 'https://images.unsplash.com/photo-1531415074868-036b1c5d53ec?auto=format&fit=crop&w=200&q=80',
          initialBudget: 100000000,
          remainingBalance: 100000000,
          totalSpent: 0,
          shortcutKey: 'E'
        },
        {
          name: 'Delhi Daredevils',
          logo: 'https://images.unsplash.com/photo-1563298723-dcfebaa392e3?auto=format&fit=crop&w=200&q=80',
          initialBudget: 100000000,
          remainingBalance: 100000000,
          totalSpent: 0,
          shortcutKey: 'R'
        },
        {
          name: 'Kolkata Kings',
          logo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=200&q=80',
          initialBudget: 100000000,
          remainingBalance: 100000000,
          totalSpent: 0,
          shortcutKey: 'T'
        }
      ];

      await Team.insertMany(teamsToCreate);
      console.log('[Seed] Default teams created with shortcuts Q, W, E, R, T.');
    }

    // 4. Default Players
    const playersCount = await Player.countDocuments();
    if (playersCount === 0) {
      const samplePlayers = [
        {
          serialNumber: 1,
          name: 'Virat Sharma',
          age: 28,
          category: catBatsman?._id,
          battingStyle: 'Right-hand bat',
          bowlingStyle: 'Right-arm medium',
          previousTeam: 'Bangalore Blasters',
          basePrice: 2000000,
          description: 'Prolific top-order stroke maker with aggressive intent and remarkable consistency.',
          photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
          status: 'PENDING'
        },
        {
          serialNumber: 2,
          name: 'Jaspreet Singh',
          age: 26,
          category: catBowler?._id,
          battingStyle: 'Right-hand bat',
          bowlingStyle: 'Right-arm fast yorker specialist',
          previousTeam: 'Mumbai Strikers',
          basePrice: 2000000,
          description: 'Premier death-overs fast bowler known for devastating toe-crushers and economy under pressure.',
          photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
          status: 'PENDING'
        },
        {
          serialNumber: 3,
          name: 'Hardik Patel',
          age: 27,
          category: catAllRounder?._id,
          battingStyle: 'Right-hand bat',
          bowlingStyle: 'Right-arm fast medium',
          previousTeam: 'Gujarat Gladiators',
          basePrice: 1500000,
          description: 'Dynamic hard-hitting finisher and reliable middle-overs seamer.',
          photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
          status: 'PENDING'
        },
        {
          serialNumber: 4,
          name: 'Rishabh Verma',
          age: 24,
          category: catWK?._id,
          battingStyle: 'Left-hand bat',
          bowlingStyle: 'N/A',
          previousTeam: 'Delhi Daredevils',
          basePrice: 1500000,
          description: 'Explosive left-handed wicketkeeper-batsman capable of flipping match momentum in minutes.',
          photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=500&q=80',
          status: 'PENDING'
        },
        {
          serialNumber: 5,
          name: 'Rashid Khanzada',
          age: 25,
          category: catBowler?._id,
          battingStyle: 'Right-hand bat',
          bowlingStyle: 'Right-arm leg break googly',
          previousTeam: 'Hyderabad Suns',
          basePrice: 1500000,
          description: 'World-class leg-spinner with unpickable quick arm action and sharp googlies.',
          photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&q=80',
          status: 'PENDING'
        },
        {
          serialNumber: 6,
          name: 'Shubham Gill',
          age: 23,
          category: catBatsman?._id,
          battingStyle: 'Right-hand bat',
          bowlingStyle: 'Right-arm off break',
          previousTeam: 'Kolkata Kings',
          basePrice: 1000000,
          description: 'Elegant top-order batsman with classical technique and high boundary percentage.',
          photo: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=500&q=80',
          status: 'PENDING'
        },
        {
          serialNumber: 7,
          name: 'Glenn Maxwellton',
          age: 31,
          category: catAllRounder?._id,
          battingStyle: 'Right-hand bat',
          bowlingStyle: 'Right-arm off spin',
          previousTeam: 'Bangalore Blasters',
          basePrice: 1000000,
          description: 'High-strike-rate 360-degree powerhouse and handy off-spin bowling option.',
          photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80',
          status: 'PENDING'
        },
        {
          serialNumber: 8,
          name: 'Sanju Samandar',
          age: 29,
          category: catWK?._id,
          battingStyle: 'Right-hand bat',
          bowlingStyle: 'N/A',
          previousTeam: 'Rajasthan Royals',
          basePrice: 1000000,
          description: 'Effortless six-hitter and calm leader behind the stumps.',
          photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=500&q=80',
          status: 'PENDING'
        }
      ];

      await Player.insertMany(samplePlayers);
      console.log('[Seed] 8 sample cricket players inserted with serial numbers 1 to 8.');
    }

    // 5. Settings & Initial State
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
      console.log('[Seed] Default auction settings saved.');
    } else if (settings.websiteTitle === 'Cricket Auction Pro') {
      settings.websiteTitle = 'AUCTION PRO';
      await settings.save();
    }

    let state = await AuctionState.findOne();
    if (!state) {
      await AuctionState.create({
        status: 'IDLE',
        currentIncrement: settings.defaultIncrement,
        currentRound: 1,
        isUnsoldRound: false
      });
      console.log('[Seed] Initial Auction state initialized.');
    }

  } catch (error) {
    console.error('[Seed] Error seeding data:', error.message);
  }
};

module.exports = { seedInitialData };
