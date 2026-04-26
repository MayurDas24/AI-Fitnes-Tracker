const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const Progress = require('../models/Progress')

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
    const progress = await Progress.find({ userId: req.userId }).sort({ createdAt: -1 })
    res.json(progress)
  } catch (error) {
    console.error('Get progress error:', error)
    res.status(500).json({ message: 'Failed to fetch progress' })
  }
})

router.post('/', auth, async (req, res) => {
  try {
    const { date, photos, ...rest } = req.body
    if (!date) {
      return res.status(400).json({ message: 'Date is required' })
    }

    const payload = { ...rest }
    if (payload.measurements && typeof payload.measurements === 'object') {
      payload.measurements = Object.fromEntries(
        Object.entries(payload.measurements).filter(([, v]) => v !== undefined && v !== null && v !== '')
      )
      // Don't $set empty measurements object
      if (Object.keys(payload.measurements).length === 0) delete payload.measurements
    }

    // Build the update: $set for scalars, $push for photos array
    const update = {
      $set: { userId: req.userId, date, ...payload },
    }

    // If photos are provided, push them into the array (don't overwrite)
    if (photos && photos.length > 0) {
      update.$push = { photos: { $each: photos } }
    }

    const savedProgress = await Progress.findOneAndUpdate(
      { userId: req.userId, date },
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: false }
    )

    res.status(200).json(savedProgress)
  } catch (error) {
    console.error('Save progress error:', error)
    res.status(400).json({ message: 'Failed to save progress' })
  }
})


router.delete('/:id', auth, async (req, res) => {
  try {
    await Progress.findOneAndDelete({ _id: req.params.id, userId: req.userId })
    res.json({ message: 'Progress entry deleted' })
  } catch (error) {
    console.error('Delete progress error:', error)
    res.status(500).json({ message: 'Failed to delete progress' })
  }
})

module.exports = router
