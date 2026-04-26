const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const Meal = require('../models/Meal')

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
    const meals = await Meal.find({ userId: req.userId }).sort({ createdAt: -1 })
    res.json(meals)
  } catch (error) {
    console.error('Get meals error:', error)
    res.status(500).json({ message: 'Failed to fetch meals' })
  }
})

router.get('/date/:date', auth, async (req, res) => {
  try {
    const meals = await Meal.find({ 
      userId: req.userId,
      date: req.params.date 
    })
    res.json(meals)
  } catch (error) {
    console.error('Get meals by date error:', error)
    res.status(500).json({ message: 'Failed to fetch meals' })
  }
})

router.post('/', auth, async (req, res) => {
  try {
    const meal = new Meal({
      userId: req.userId,
      ...req.body,
    })
    const newMeal = await meal.save()
    res.status(201).json(newMeal)
  } catch (error) {
    console.error('Save meal error:', error)
    res.status(400).json({ message: 'Failed to save meal' })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    await Meal.findOneAndDelete({ _id: req.params.id, userId: req.userId })
    res.json({ message: 'Meal deleted' })
  } catch (error) {
    console.error('Delete meal error:', error)
    res.status(500).json({ message: 'Failed to delete meal' })
  }
})

module.exports = router
