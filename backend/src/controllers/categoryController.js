const Category = require('../models/Category');
const Player = require('../models/Player');

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ displayOrder: 1, name: 1 });
    
    // Count players for each category
    const categoryStats = await Promise.all(
      categories.map(async (cat) => {
        const playerCount = await Player.countDocuments({ category: cat._id });
        return {
          ...cat.toObject(),
          playerCount
        };
      })
    );

    return res.json({
      success: true,
      categories: categoryStats
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch categories.',
      error: error.message
    });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description, displayOrder } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.'
      });
    }

    const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A category with this name already exists.'
      });
    }

    const category = new Category({
      name: name.trim(),
      description: description ? description.trim() : '',
      displayOrder: displayOrder || 0
    });

    await category.save();

    return res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      category
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create category.',
      error: error.message
    });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, displayOrder } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      });
    }

    if (name && name.trim()) {
      const existing = await Category.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Another category with this name already exists.'
        });
      }
      category.name = name.trim();
    }

    if (description !== undefined) category.description = description.trim();
    if (displayOrder !== undefined) category.displayOrder = displayOrder;

    await category.save();

    return res.json({
      success: true,
      message: 'Category updated successfully.',
      category
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update category.',
      error: error.message
    });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      });
    }

    // Check if players are assigned to this category
    const playersCount = await Player.countDocuments({ category: id });
    if (playersCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category "${category.name}". There are ${playersCount} player(s) assigned to this category. Please reassign or delete those players first.`
      });
    }

    await Category.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: 'Category deleted successfully.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete category.',
      error: error.message
    });
  }
};

exports.getCategoryPlayers = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      });
    }

    const players = await Player.find({ category: id }).populate('soldTo', 'name logo');
    return res.json({
      success: true,
      category,
      players
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch players for this category.',
      error: error.message
    });
  }
};
