const mongoose = require('mongoose')

const WaterSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    default: 0,
  },
  goal: {
    type: Number,
    default: 2000,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

WaterSchema.index({ userId: 1, date: 1 }, { unique: true })

module.exports = mongoose.model('Water', WaterSchema)
