const Team = require('../models/Team');
const Player = require('../models/Player');
const { uploadToCloudinary } = require('../config/cloudinary');

exports.getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find().populate({
      path: 'purchasedPlayers',
      select: 'name serialNumber category basePrice soldPrice battingStyle bowlingStyle photo',
      populate: { path: 'category', select: 'name' }
    }).sort({ name: 1 });

    return res.json({
      success: true,
      teams
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch teams.',
      error: error.message
    });
  }
};

exports.getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findById(id).populate({
      path: 'purchasedPlayers',
      populate: { path: 'category', select: 'name' }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found.'
      });
    }

    return res.json({
      success: true,
      team
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch team.',
      error: error.message
    });
  }
};

exports.createTeam = async (req, res) => {
  try {
    const { name, initialBudget, shortcutKey } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Team name is required.' });
    }

    const budgetNum = Number(initialBudget);
    if (isNaN(budgetNum) || budgetNum < 0) {
      return res.status(400).json({ success: false, message: 'Valid initial budget is required.' });
    }

    if (!shortcutKey || !shortcutKey.trim()) {
      return res.status(400).json({ success: false, message: 'Keyboard shortcut key is required.' });
    }

    const cleanShortcut = shortcutKey.trim().toUpperCase()[0];

    // Check duplicate name
    const existingName = await Team.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existingName) {
      return res.status(400).json({ success: false, message: 'A team with this name already exists.' });
    }

    // Check duplicate shortcut
    const existingShortcut = await Team.findOne({ shortcutKey: cleanShortcut });
    if (existingShortcut) {
      return res.status(400).json({
        success: false,
        message: `Shortcut key "${cleanShortcut}" is already assigned to team "${existingShortcut.name}". Please pick another key.`
      });
    }

    let logoUrl = '';
    if (req.file) {
      const cloudUrl = await uploadToCloudinary(req.file.path, 'cricket_teams');
      logoUrl = cloudUrl || `/uploads/${req.file.filename}`;
    } else if (req.body.logo) {
      logoUrl = req.body.logo;
    }

    const team = new Team({
      name: name.trim(),
      logo: logoUrl,
      initialBudget: budgetNum,
      remainingBalance: budgetNum,
      totalSpent: 0,
      shortcutKey: cleanShortcut,
      purchasedPlayers: []
    });

    await team.save();

    return res.status(201).json({
      success: true,
      message: 'Team created successfully.',
      team
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create team.',
      error: error.message
    });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, initialBudget, shortcutKey } = req.body;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    if (name && name.trim()) {
      const existingName = await Team.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
      });
      if (existingName) {
        return res.status(400).json({ success: false, message: 'Another team already has this name.' });
      }
      team.name = name.trim();
    }

    if (shortcutKey && shortcutKey.trim()) {
      const cleanShortcut = shortcutKey.trim().toUpperCase()[0];
      const existingShortcut = await Team.findOne({
        _id: { $ne: id },
        shortcutKey: cleanShortcut
      });
      if (existingShortcut) {
        return res.status(400).json({
          success: false,
          message: `Shortcut key "${cleanShortcut}" is already assigned to team "${existingShortcut.name}".`
        });
      }
      team.shortcutKey = cleanShortcut;
    }

    if (initialBudget !== undefined) {
      const newInitial = Number(initialBudget);
      if (isNaN(newInitial) || newInitial < team.totalSpent) {
        return res.status(400).json({
          success: false,
          message: `Initial budget cannot be less than the already spent amount of ${team.totalSpent}.`
        });
      }
      team.initialBudget = newInitial;
      team.remainingBalance = newInitial - team.totalSpent;
    }

    if (req.file) {
      const cloudUrl = await uploadToCloudinary(req.file.path, 'cricket_teams');
      team.logo = cloudUrl || `/uploads/${req.file.filename}`;
    } else if (req.body.logo) {
      team.logo = req.body.logo;
    }

    await team.save();

    return res.json({
      success: true,
      message: 'Team updated successfully.',
      team
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update team.',
      error: error.message
    });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    if (team.purchasedPlayers && team.purchasedPlayers.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete team "${team.name}" because it has already purchased ${team.purchasedPlayers.length} player(s). Reset auction data or unassign players first.`
      });
    }

    await Team.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: 'Team deleted successfully.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete team.',
      error: error.message
    });
  }
};
