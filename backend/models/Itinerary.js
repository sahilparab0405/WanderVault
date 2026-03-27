const mongoose = require('mongoose');

const itinerarySchema = new mongoose.Schema({
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  day: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  location: {
    type: String
  },
  time: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Itinerary', itinerarySchema);