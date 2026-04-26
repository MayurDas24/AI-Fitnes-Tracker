// backend/routes/ai.js
// Secure server-side proxy for Groq API — keeps the API key out of the browser bundle.

const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Auth middleware (same logic as auth.js)
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

/**
 * POST /api/ai/chat
 * Body: { messages: Array<{ role, content }>, model?, temperature?, max_tokens? }
 * Returns Groq completion response.
 */
router.post('/chat', auth, async (req, res) => {
  if (!GROQ_API_KEY) {
    return res.status(503).json({ message: 'AI service not configured. Add GROQ_API_KEY to backend .env.' })
  }

  const { messages, model, temperature, max_tokens } = req.body

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ message: 'messages array is required' })
  }

  // Basic sanity check — prevent oversized requests
  if (messages.length > 50) {
    return res.status(400).json({ message: 'Too many messages. Keep conversation under 50 turns.' })
  }

  try {
    const groqResponse = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'llama-3.3-70b-versatile',
        messages,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens ?? 2048,
      }),
    })

    const data = await groqResponse.json()

    if (!groqResponse.ok) {
      // Pass Groq's status/message through so the frontend can handle 429s etc.
      return res.status(groqResponse.status).json({
        message: data?.error?.message || `Groq API error: ${groqResponse.status}`,
        groqError: data?.error,
      })
    }

    return res.json(data)
  } catch (err) {
    console.error('AI proxy error:', err)
    return res.status(500).json({ message: 'Failed to reach AI service. Please try again.' })
  }
})

module.exports = router
