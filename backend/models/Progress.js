const mongoose = require('mongoose')

const ProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  weight: Number,
  bodyFat: Number,
  measurements: {
    chest: Number,
    waist: Number,
    hips: Number,
    arms: Number,
    legs: Number,
  },
  photos: [String],
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('Progress', ProgressSchema)
