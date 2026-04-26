const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const Water = require('../models/Water')

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

const getTodayDate = () => new Date().toISOString().split('T')[0]

router.get('/', auth, async (req, res) => {
  try {
    const records = await Water.find({ userId: req.userId }).sort({ date: -1 })
    res.json(records)
  } catch (error) {
    console.error('Get water records error:', error)
    res.status(500).json({ message: 'Failed to fetch water records' })
  }
})

router.get('/today', auth, async (req, res) => {
  try {
    const today = getTodayDate()
    const record = await Water.findOne({ userId: req.userId, date: today })
    res.json(record || null)
  } catch (error) {
    console.error('Get today water error:', error)
    res.status(500).json({ message: 'Failed to fetch today water intake' })
  }
})

router.post('/', auth, async (req, res) => {
  try {
    const { date, amount = 0, goal = 2000 } = req.body

    if (!date) {
      return res.status(400).json({ message: 'Date is required' })
    }

    if (!Number.isFinite(amount) || amount < 0 || !Number.isFinite(goal) || goal <= 0) {
      return res.status(400).json({ message: 'Invalid amount or goal' })
    }

    const record = await Water.findOneAndUpdate(
      { userId: req.userId, date },
      {
        $set: {
          amount,
          goal,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    )

    res.status(201).json(record)
  } catch (error) {
    console.error('Save water error:', error)
    res.status(500).json({ message: 'Failed to save water intake' })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Water.findOneAndDelete({ _id: req.params.id, userId: req.userId })

    if (!deleted) {
      return res.status(404).json({ message: 'Water record not found' })
    }

    res.json({ message: 'Water record deleted' })
  } catch (error) {
    console.error('Delete water error:', error)
    res.status(500).json({ message: 'Failed to delete water record' })
  }
})

module.exports = router
