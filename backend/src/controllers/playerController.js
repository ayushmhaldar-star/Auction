const Player = require('../models/Player');
const Category = require('../models/Category');
const Team = require('../models/Team');
const { uploadToCloudinary } = require('../config/cloudinary');
const xlsx = require('xlsx');
const fs = require('fs');

// Helper to get next auto-increment serial number
const getNextSerialNumber = async () => {
  const highestPlayer = await Player.findOne().sort({ serialNumber: -1 });
  return highestPlayer ? highestPlayer.serialNumber + 1 : 1;
};

exports.getAllPlayers = async (req, res) => {
  try {
    const { category, status, search, sort = 'serialNumber', order = 'asc' } = req.query;

    const query = {};
    if (category) query.category = category;
    if (status) query.status = status;

    if (search) {
      const searchNum = Number(search);
      if (!isNaN(searchNum)) {
        query.$or = [
          { serialNumber: searchNum },
          { name: { $regex: search, $options: 'i' } }
        ];
      } else {
        query.name = { $regex: search, $options: 'i' };
      }
    }

    const sortOption = {};
    sortOption[sort] = order === 'desc' ? -1 : 1;

    const players = await Player.find(query)
      .populate('category', 'name')
      .populate('soldTo', 'name logo')
      .sort(sortOption);

    return res.json({
      success: true,
      count: players.length,
      players
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch players.',
      error: error.message
    });
  }
};

exports.getPlayerById = async (req, res) => {
  try {
    const { id } = req.params;
    const player = await Player.findById(id)
      .populate('category', 'name')
      .populate('soldTo', 'name logo');

    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found.' });
    }

    return res.json({ success: true, player });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch player details.',
      error: error.message
    });
  }
};

exports.getPlayerBySerial = async (req, res) => {
  try {
    const { serialNumber } = req.params;
    const player = await Player.findOne({ serialNumber: Number(serialNumber) })
      .populate('category', 'name')
      .populate('soldTo', 'name logo');

    if (!player) {
      return res.status(404).json({ success: false, message: `Player #${serialNumber} not found.` });
    }

    return res.json({ success: true, player });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch player by serial number.',
      error: error.message
    });
  }
};

exports.createPlayer = async (req, res) => {
  try {
    const {
      name,
      age,
      category,
      battingStyle,
      bowlingStyle,
      previousTeam,
      basePrice,
      description,
      serialNumber
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Player name is required.' });
    }

    if (!age || isNaN(Number(age))) {
      return res.status(400).json({ success: false, message: 'Valid age is required.' });
    }

    if (!category) {
      return res.status(400).json({ success: false, message: 'Category is required.' });
    }

    const catExists = await Category.findById(category);
    if (!catExists) {
      return res.status(400).json({ success: false, message: 'Selected category does not exist.' });
    }

    if (basePrice === undefined || isNaN(Number(basePrice)) || Number(basePrice) < 0) {
      return res.status(400).json({ success: false, message: 'Valid base price is required.' });
    }

    let finalSerial;
    if (serialNumber) {
      const parsedSerial = Number(serialNumber);
      const existing = await Player.findOne({ serialNumber: parsedSerial });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Serial number ${parsedSerial} is already assigned to ${existing.name}.`
        });
      }
      finalSerial = parsedSerial;
    } else {
      finalSerial = await getNextSerialNumber();
    }

    let photoUrl = '';
    if (req.file) {
      const cloudUrl = await uploadToCloudinary(req.file.path, 'cricket_players');
      photoUrl = cloudUrl || `/uploads/${req.file.filename}`;
    } else if (req.body.photo) {
      photoUrl = req.body.photo;
    }

    const player = new Player({
      serialNumber: finalSerial,
      name: name.trim(),
      photo: photoUrl,
      age: Number(age),
      category,
      battingStyle: battingStyle || 'Right-hand bat',
      bowlingStyle: bowlingStyle || 'Right-arm medium',
      previousTeam: previousTeam || '',
      basePrice: Number(basePrice),
      description: description || ''
    });

    await player.save();
    await player.populate('category', 'name');

    return res.status(201).json({
      success: true,
      message: 'Player created successfully.',
      player
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create player.',
      error: error.message
    });
  }
};

exports.updatePlayer = async (req, res) => {
  try {
    const { id } = req.params;
    const player = await Player.findById(id);
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found.' });
    }

    const {
      name,
      age,
      category,
      battingStyle,
      bowlingStyle,
      previousTeam,
      basePrice,
      description,
      serialNumber,
      status
    } = req.body;

    if (serialNumber !== undefined) {
      const parsedSerial = Number(serialNumber);
      if (parsedSerial !== player.serialNumber) {
        const existing = await Player.findOne({
          _id: { $ne: id },
          serialNumber: parsedSerial
        });
        if (existing) {
          return res.status(400).json({
            success: false,
            message: `Serial number ${parsedSerial} is already assigned to ${existing.name}.`
          });
        }
        player.serialNumber = parsedSerial;
      }
    }

    if (name) player.name = name.trim();
    if (age) player.age = Number(age);
    if (battingStyle) player.battingStyle = battingStyle;
    if (bowlingStyle) player.bowlingStyle = bowlingStyle;
    if (previousTeam !== undefined) player.previousTeam = previousTeam;
    if (description !== undefined) player.description = description;
    if (basePrice !== undefined) player.basePrice = Number(basePrice);
    if (status) player.status = status;

    if (category) {
      const catExists = await Category.findById(category);
      if (!catExists) {
        return res.status(400).json({ success: false, message: 'Selected category does not exist.' });
      }
      player.category = category;
    }

    if (req.file) {
      const cloudUrl = await uploadToCloudinary(req.file.path, 'cricket_players');
      player.photo = cloudUrl || `/uploads/${req.file.filename}`;
    } else if (req.body.photo) {
      player.photo = req.body.photo;
    }

    await player.save();
    await player.populate('category', 'name');
    await player.populate('soldTo', 'name logo');

    return res.json({
      success: true,
      message: 'Player updated successfully.',
      player
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update player.',
      error: error.message
    });
  }
};

exports.deletePlayer = async (req, res) => {
  try {
    const { id } = req.params;
    const player = await Player.findById(id);
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found.' });
    }

    // If player was sold, remove from team and refund balance
    if (player.status === 'SOLD' && player.soldTo) {
      const team = await Team.findById(player.soldTo);
      if (team) {
        team.purchasedPlayers = team.purchasedPlayers.filter(pId => pId.toString() !== id);
        team.remainingBalance += player.soldPrice;
        team.totalSpent = Math.max(0, team.totalSpent - player.soldPrice);
        await team.save();
      }
    }

    await Player.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: 'Player deleted successfully.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete player.',
      error: error.message
    });
  }
};

// Bulk import via CSV / Excel
exports.importPlayers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Spreadsheet file (.csv or .xlsx) is required.' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({ success: false, message: 'The uploaded file contains no data.' });
    }

    const categories = await Category.find();
    const categoryMap = new Map();
    categories.forEach(c => categoryMap.set(c.name.toLowerCase().trim(), c._id));

    // Fallback default category
    let defaultCatId = categories[0]?._id;
    if (!defaultCatId) {
      const newCat = await Category.create({ name: 'All-Rounder', description: 'Default category' });
      defaultCatId = newCat._id;
      categoryMap.set('all-rounder', newCat._id);
    }

    let nextSerial = await getNextSerialNumber();
    const importedPlayers = [];
    const errors = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const name = row['Name'] || row['name'] || row['Player Name'] || row['player_name'];
      if (!name) {
        errors.push(`Row ${i + 1}: Name missing, skipped.`);
        continue;
      }

      const catName = (row['Category'] || row['category'] || '').toString().toLowerCase().trim();
      let categoryId = categoryMap.get(catName);
      if (!categoryId && catName) {
        // Create new category dynamically
        const createdCat = await Category.create({ name: row['Category'].trim() });
        categoryMap.set(catName, createdCat._id);
        categoryId = createdCat._id;
      }
      if (!categoryId) categoryId = defaultCatId;

      const age = Number(row['Age'] || row['age']) || 24;
      const basePrice = Number(row['Base Price'] || row['BasePrice'] || row['base_price']) || 100000;
      const battingStyle = row['Batting Style'] || row['batting_style'] || 'Right-hand bat';
      const bowlingStyle = row['Bowling Style'] || row['bowling_style'] || 'Right-arm medium';
      const previousTeam = row['Previous Team'] || row['previous_team'] || '';
      const description = row['Description'] || row['description'] || '';

      let serialNum = Number(row['Serial Number'] || row['serial_number']);
      if (!serialNum || isNaN(serialNum)) {
        serialNum = nextSerial++;
      } else {
        const exist = await Player.findOne({ serialNumber: serialNum });
        if (exist) {
          serialNum = nextSerial++;
        }
      }

      const newPlayer = new Player({
        serialNumber: serialNum,
        name: name.toString().trim(),
        age,
        category: categoryId,
        battingStyle,
        bowlingStyle,
        previousTeam,
        basePrice,
        description,
        status: 'PENDING'
      });

      await newPlayer.save();
      importedPlayers.push(newPlayer);
    }

    // Clean up uploaded temp file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.json({
      success: true,
      message: `Successfully imported ${importedPlayers.length} players.`,
      importedCount: importedPlayers.length,
      errors
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to process file import.',
      error: error.message
    });
  }
};
