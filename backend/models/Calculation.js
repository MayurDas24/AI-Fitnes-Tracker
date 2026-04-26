const mongoose = require('mongoose')

const CalculationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  calculationType: {
    type: String,
    required: true,
  },
  inputs: {
    type: Object,
    required: true,
  },
  results: {
    type: Object,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

CalculationSchema.index({ userId: 1, calculationType: 1 })

module.exports = mongoose.model('Calculation', CalculationSchema)
