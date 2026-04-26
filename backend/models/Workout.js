const mongoose = require('mongoose')

const WorkoutSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  exercises: {
    type: Number,
    default: 0,
  },
  completedSets: {
    type: Number,
    default: 0,
  },
  volume: {
    type: Number,
    default: 0,
  },
  calories: {
    type: Number,
    default: 0,
  },
  duration: {
    type: Number,
    default: 0,
  },
  workoutData: {
    type: Array,
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('Workout', WorkoutSchema)
