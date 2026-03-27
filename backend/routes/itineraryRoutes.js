const express = require('express');
const router = express.Router();
const Itinerary = require('../models/Itinerary');
const { protect } = require('../middleware/authMiddleware');

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
router.post('/:tripId', protect, async (req, res) => {
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
    await Itinerary.findByIdAndDelete(req.params.itemId);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;