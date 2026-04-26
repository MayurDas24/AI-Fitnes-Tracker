const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const BodyAnalysis = require('../models/BodyAnalysis')

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
    const analyses = await BodyAnalysis.find({ userId: req.userId }).sort({ createdAt: -1 })
    res.json(analyses)
  } catch (error) {
    console.error('Get body analyses error:', error)
    res.status(500).json({ message: 'Failed to fetch body analyses' })
  }
})

router.get('/:id', auth, async (req, res) => {
  try {
    const analysis = await BodyAnalysis.findOne({ _id: req.params.id, userId: req.userId })

    if (!analysis) {
      return res.status(404).json({ message: 'Body analysis not found' })
    }

    res.json(analysis)
  } catch (error) {
    console.error('Get body analysis error:', error)
    res.status(500).json({ message: 'Failed to fetch body analysis' })
  }
})

router.post('/', auth, async (req, res) => {
  try {
    const { name, photoUrl, focusAreas = [], trainingPlan = '' } = req.body

    if (!name || !Array.isArray(focusAreas) || focusAreas.length === 0) {
      return res.status(400).json({ message: 'name and focusAreas are required' })
    }

    const analysis = new BodyAnalysis({
      userId: req.userId,
      name,
      photoUrl,
      focusAreas,
      trainingPlan,
    })

    const saved = await analysis.save()
    res.status(201).json(saved)
  } catch (error) {
    console.error('Create body analysis error:', error)
    res.status(500).json({ message: 'Failed to create body analysis' })
  }
})

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, photoUrl, focusAreas, trainingPlan } = req.body

    const updated = await BodyAnalysis.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      {
        $set: {
          ...(name !== undefined ? { name } : {}),
          ...(photoUrl !== undefined ? { photoUrl } : {}),
          ...(focusAreas !== undefined ? { focusAreas } : {}),
          ...(trainingPlan !== undefined ? { trainingPlan } : {}),
        },
      },
      { new: true }
    )

    if (!updated) {
      return res.status(404).json({ message: 'Body analysis not found' })
    }

    res.json(updated)
  } catch (error) {
    console.error('Update body analysis error:', error)
    res.status(500).json({ message: 'Failed to update body analysis' })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await BodyAnalysis.findOneAndDelete({ _id: req.params.id, userId: req.userId })

    if (!deleted) {
      return res.status(404).json({ message: 'Body analysis not found' })
    }

    res.json({ message: 'Body analysis deleted' })
  } catch (error) {
    console.error('Delete body analysis error:', error)
    res.status(500).json({ message: 'Failed to delete body analysis' })
  }
})

module.exports = router
