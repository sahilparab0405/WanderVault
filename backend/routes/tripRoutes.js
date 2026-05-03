const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const { protect } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validate');

// GET all trips for logged in user
router.get('/', protect, async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET public trip (NO auth required) — must be before /:id
router.get('/public/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate('user', 'name');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    if (!trip.isPublic) return res.status(403).json({ message: 'This trip is private' });

    // Return trip data WITHOUT budget/expense info
    const publicTrip = {
      _id: trip._id,
      name: trip.name,
      destination: trip.destination,
      latitude: trip.latitude,
      longitude: trip.longitude,
      travelMode: trip.travelMode,
      startDate: trip.startDate,
      endDate: trip.endDate,
      itinerary: trip.itinerary,
      accommodation: trip.accommodation,
      userName: trip.user?.name || 'A Traveler',
      isPublic: trip.isPublic
    };
    res.json(publicTrip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new trip
router.post('/', protect, [
  body('name').trim().notEmpty().withMessage('Trip name is required').isLength({ max: 100 }).withMessage('Trip name too long'),
  body('destination').trim().notEmpty().withMessage('Destination is required'),
  body('startDate').isISO8601().toDate().withMessage('Valid start date is required'),
  body('endDate').isISO8601().toDate().withMessage('Valid end date is required'),
  body('budget').isNumeric().withMessage('Budget must be a number').custom(val => val >= 0).withMessage('Budget cannot be negative'),
  body('travelMode').optional().isIn(['flight', 'train', 'bus', 'car']).withMessage('Invalid travel mode'),
  body('latitude').optional().isNumeric(),
  body('longitude').optional().isNumeric(),
  body('accommodation').optional().isArray(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { name, destination, startDate, endDate, budget, travelMode, latitude, longitude, accommodation } = req.body;

    const initialItinerary = [];
    if (accommodation && accommodation.length > 0) {
      accommodation.forEach(acc => {
        initialItinerary.push({
          day: parseInt(acc.fromDay) || 1,
          title: `Stay: ${acc.name}`,
          location: destination,
          description: `Check-in: ${acc.checkIn || 'TBD'}`
        });
      });
    }

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
      accommodation: accommodation || [],
      itinerary: initialItinerary
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

// PATCH toggle trip visibility (public/private)
router.patch('/:id/visibility', protect, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    trip.isPublic = !trip.isPublic;
    await trip.save();
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST clone trip
router.post('/:id/clone', protect, async (req, res) => {
  try {
    const original = await Trip.findById(req.params.id);
    if (!original) return res.status(404).json({ message: 'Trip not found' });
    if (original.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Clone itinerary items (without _id)
    const clonedItinerary = (original.itinerary || []).map(item => ({
      day: item.day,
      title: item.title,
      location: item.location,
      description: item.description
    }));

    const clonedTrip = await Trip.create({
      user: req.user._id,
      name: `Copy of ${original.name}`,
      destination: original.destination,
      latitude: original.latitude,
      longitude: original.longitude,
      travelMode: original.travelMode,
      startDate: original.startDate,
      endDate: original.endDate,
      budget: original.budget,
      totalExpense: 0,
      budgetExceeded: false,
      accommodation: original.accommodation || [],
      itinerary: clonedItinerary,
      isPublic: false
    });

    res.status(201).json(clonedTrip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT full accommodation to trip (adds single accommodation to array)
router.put('/:id/accommodation', protect, [
  body('name').trim().notEmpty().withMessage('Accommodation name is required'),
  body('address').optional().trim(),
  body('fromDay').optional().isInt(),
  body('toDay').optional().isInt(),
  body('pricePerNight').optional().isNumeric(),
  handleValidationErrors
], async (req, res) => {
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