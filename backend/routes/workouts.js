const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const Workout = require('../models/Workout')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ message: 'No token provided' })
    }
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch {
    res.status(401).json({ message: 'Invalid token' })
  }
}

router.get('/', auth, async (req, res) => {
  try {
    const workouts = await Workout.find({ userId: req.userId }).sort({ createdAt: -1 })
    res.json(workouts)
  } catch (error) {
    console.error('Get workouts error:', error)
    res.status(500).json({ message: 'Failed to fetch workouts' })
  }
})

router.post('/', auth, async (req, res) => {
  try {
    const workout = new Workout({
      userId: req.userId,
      date: req.body.date,
      exercises: req.body.exercises,
      completedSets: req.body.completedSets,
      volume: req.body.volume,
      calories: req.body.calories,
      duration: req.body.duration,
      workoutData: req.body.workoutData,
    })

    const newWorkout = await workout.save()
    res.status(201).json(newWorkout)
  } catch (error) {
    console.error('Save workout error:', error)
    res.status(400).json({ message: 'Failed to save workout' })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    await Workout.findOneAndDelete({ _id: req.params.id, userId: req.userId })
    res.json({ message: 'Workout deleted' })
  } catch (error) {
    console.error('Delete workout error:', error)
    res.status(500).json({ message: 'Failed to delete workout' })
  }
})

module.exports = router
