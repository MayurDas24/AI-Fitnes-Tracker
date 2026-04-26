// backend/server.js
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const passport = require('passport')
const session = require('express-session')
require('dotenv').config()

const app = express()
const BODY_LIMIT = process.env.BODY_LIMIT || '5mb'

// Set FRONTEND_URL in production for OAuth callback redirects (used in routes/auth.js).
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}))
app.use(express.json({ limit: BODY_LIMIT }))
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }))

// Session for passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'session-secret-key',
  resave: false,
  saveUninitialized: false
}))

// Passport config
require('./config/passport')(passport)
app.use(passport.initialize())
app.use(passport.session())

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fitness-tracker'

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err))

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' })
})

// Import routes
const authRoutes = require('./routes/auth')
const workoutRoutes = require('./routes/workouts')
const mealRoutes = require('./routes/meals')
const progressRoutes = require('./routes/progress')
const waterRoutes = require('./routes/water')
const favoriteRoutes = require('./routes/favorites')
const bodyAnalysisRoutes = require('./routes/bodyAnalysis')
const calculationRoutes = require('./routes/calculations')
const aiRoutes = require('./routes/ai')

// Use routes
app.use('/api/auth', authRoutes)
app.use('/api/workouts', workoutRoutes)
app.use('/api/meals', mealRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/water', waterRoutes)
app.use('/api/favorites', favoriteRoutes)
app.use('/api/body-analysis', bodyAnalysisRoutes)
app.use('/api/calculations', calculationRoutes)
app.use('/api/ai', aiRoutes)

// Error handling middleware
app.use((err, req, res, _next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      message: `Payload too large. Max allowed is ${BODY_LIMIT}.`,
    })
  }

  console.error('Server error:', err)
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// Start server
const PORT = process.env.PORT || 5000

const MAX_LISTEN_RETRIES = 5

const logReady = () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📡 API endpoints ready:`)
  console.log(`   - POST /api/auth/signup`)
  console.log(`   - POST /api/auth/login`)
  console.log(`   - GET  /api/auth/google (Google OAuth)`)
  console.log(`   - GET  /api/workouts`)
  console.log(`   - POST /api/workouts`)
  console.log(`   - GET  /api/meals`)
  console.log(`   - POST /api/meals`)
  console.log(`   - GET  /api/progress`)
  console.log(`   - POST /api/progress`)
  console.log(`   - GET  /api/water`)
  console.log(`   - GET  /api/water/today`)
  console.log(`   - POST /api/water`)
  console.log(`   - GET  /api/favorites`)
  console.log(`   - POST /api/favorites`)
  console.log(`   - GET  /api/body-analysis`)
  console.log(`   - POST /api/body-analysis`)
  console.log(`   - GET  /api/calculations`)
  console.log(`   - POST /api/calculations`)
}

const startServer = (attempt = 1) => {
  const server = app.listen(PORT, logReady)

  server.on('error', (err) => {
    if (err?.code === 'EADDRINUSE' && attempt < MAX_LISTEN_RETRIES) {
      const nextAttempt = attempt + 1
      console.warn(`Port ${PORT} is busy. Retrying startup (${nextAttempt}/${MAX_LISTEN_RETRIES})...`)
      setTimeout(() => startServer(nextAttempt), 400)
      return
    }

    console.error('Server startup error:', err)
    process.exit(1)
  })
}

startServer()
