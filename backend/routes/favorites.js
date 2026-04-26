const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const Favorite = require('../models/Favorite')

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
    const favorites = await Favorite.find({ userId: req.userId }).sort({ createdAt: -1 })
    res.json(favorites)
  } catch (error) {
    console.error('Get favorites error:', error)
    res.status(500).json({ message: 'Failed to fetch favorites' })
  }
})

router.post('/', auth, async (req, res) => {
  try {
    const { exerciseId, exerciseName, category } = req.body

    if (!exerciseId || !exerciseName) {
      return res.status(400).json({ message: 'exerciseId and exerciseName are required' })
    }

    const favorite = await Favorite.findOneAndUpdate(
      { userId: req.userId, exerciseId },
      {
        $set: {
          exerciseName,
          category,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    )

    res.status(201).json(favorite)
  } catch (error) {
    console.error('Add favorite error:', error)
    res.status(500).json({ message: 'Failed to add favorite' })
  }
})

router.delete('/:exerciseId', auth, async (req, res) => {
  try {
    const deleted = await Favorite.findOneAndDelete({
      userId: req.userId,
      exerciseId: req.params.exerciseId,
    })

    if (!deleted) {
      return res.status(404).json({ message: 'Favorite not found' })
    }

    res.json({ message: 'Favorite removed' })
  } catch (error) {
    console.error('Remove favorite error:', error)
    res.status(500).json({ message: 'Failed to remove favorite' })
  }
})

module.exports = router
