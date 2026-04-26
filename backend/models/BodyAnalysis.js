const mongoose = require('mongoose')

const BodyAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  photoUrl: {
    type: String,
  },
  focusAreas: [{
    type: String,
  }],
  trainingPlan: {
    type: String,
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

BodyAnalysisSchema.index({ userId: 1 })

module.exports = mongoose.model('BodyAnalysis', BodyAnalysisSchema)
