const mongoose = require('mongoose')

const FavoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  exerciseId: {
    type: String,
    required: true,
  },
  exerciseName: {
    type: String,
    required: true,
  },
  category: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

FavoriteSchema.index({ userId: 1, exerciseId: 1 }, { unique: true })

module.exports = mongoose.model('Favorite', FavoriteSchema)
