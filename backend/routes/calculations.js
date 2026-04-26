const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const Calculation = require('../models/Calculation')

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

const ALLOWED_TYPES = ['BMI', 'BMR', 'TDEE', 'MACROS']

router.get('/', auth, async (req, res) => {
  try {
    const calculations = await Calculation.find({ userId: req.userId }).sort({ createdAt: -1 })
    res.json(calculations)
  } catch (error) {
    console.error('Get calculations error:', error)
    res.status(500).json({ message: 'Failed to fetch calculations' })
  }
})

router.get('/:type', auth, async (req, res) => {
  try {
    const calculationType = String(req.params.type || '').toUpperCase()
    if (!ALLOWED_TYPES.includes(calculationType)) {
      return res.status(400).json({ message: 'Invalid calculation type' })
    }

    const calculations = await Calculation.find({
      userId: req.userId,
      calculationType,
    }).sort({ createdAt: -1 })

    res.json(calculations)
  } catch (error) {
    console.error('Get calculations by type error:', error)
    res.status(500).json({ message: 'Failed to fetch calculations by type' })
  }
})

router.post('/', auth, async (req, res) => {
  try {
    const { calculationType, inputs, results } = req.body

    if (!calculationType || !inputs || !results) {
      return res.status(400).json({ message: 'calculationType, inputs and results are required' })
    }

    const normalizedType = String(calculationType).toUpperCase()
    if (!ALLOWED_TYPES.includes(normalizedType)) {
      return res.status(400).json({ message: 'Invalid calculation type' })
    }

    const calculation = new Calculation({
      userId: req.userId,
      calculationType: normalizedType,
      inputs,
      results,
    })

    const saved = await calculation.save()
    res.status(201).json(saved)
  } catch (error) {
    console.error('Save calculation error:', error)
    res.status(500).json({ message: 'Failed to save calculation' })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Calculation.findOneAndDelete({ _id: req.params.id, userId: req.userId })

    if (!deleted) {
      return res.status(404).json({ message: 'Calculation not found' })
    }

    res.json({ message: 'Calculation deleted' })
  } catch (error) {
    console.error('Delete calculation error:', error)
    res.status(500).json({ message: 'Failed to delete calculation' })
  }
})

module.exports = router
