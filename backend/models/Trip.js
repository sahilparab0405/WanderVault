const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  destination: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  travelMode: {
    type: String,
    enum: ['flight', 'train', 'bus', 'car'],
    default: 'flight'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  budget: {
    type: Number,
    required: true
  },
  totalExpense: {
    type: Number,
    default: 0
  },
  budgetExceeded: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  accommodation: [{
    name: String,
    address: String,
    rating: Number,
    priceRange: String,
    checkIn: Date,
    checkOut: Date,
    photo: String,
    bookedVia: String,
    fromDay: Number,
    toDay: Number,
    pricePerNight: Number
  }]
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);