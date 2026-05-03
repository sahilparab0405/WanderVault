const express = require('express');
const router = express.Router();
const Itinerary = require('../models/Itinerary');
const { protect } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validate');

// GET all itinerary for a trip
router.get('/:tripId', protect, async (req, res) => {
  try {
    const items = await Itinerary.find({ trip: req.params.tripId })
      .sort({ day: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST add itinerary item
router.post('/:tripId', protect, [
  body('day').isInt({ min: 1 }).withMessage('Day must be a positive integer'),
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }).withMessage('Title must be less than 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('location').optional().trim().isLength({ max: 200 }).withMessage('Location must be less than 200 characters'),
  body('time').optional().trim(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { day, title, description, location, time } = req.body;
    const item = await Itinerary.create({
      trip: req.params.tripId,
      user: req.user._id,
      day, title, description, location, time
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE itinerary item
router.delete('/:itemId', protect, async (req, res) => {
  try {
    const item = await Itinerary.findById(req.params.itemId);
    
    if (!item) {
      return res.status(404).json({ message: 'Itinerary item not found' });
    }
    
    if (item.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this item' });
    }

    await item.deleteOne();
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;