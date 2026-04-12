const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const { protect } = require('../middleware/authMiddleware');

// GET all trips for logged in user
router.get('/', protect, async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new trip
router.post('/', protect, async (req, res) => {
  try {
    const { name, destination, startDate, endDate, budget, travelMode, latitude, longitude, accommodation } = req.body;

    const trip = await Trip.create({
      user: req.user._id,
      name,
      destination,
      startDate,
      endDate,
      budget,
      travelMode: travelMode || 'flight',
      latitude: latitude || null,
      longitude: longitude || null,
      accommodation: accommodation || []
    });

    res.status(201).json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single trip
router.get('/:id', protect, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT full accommodation to trip (adds single accommodation to array)
router.put('/:id/accommodation', protect, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    trip.accommodation.push(req.body);
    await trip.save();

    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE specific accommodation from trip
router.delete('/:id/accommodation/:accId', protect, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    trip.accommodation = trip.accommodation.filter(acc => acc._id.toString() !== req.params.accId);
    await trip.save();

    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE trip
router.delete('/:id', protect, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await trip.deleteOne();
    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;