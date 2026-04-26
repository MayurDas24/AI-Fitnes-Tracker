// backend/routes/auth.js
const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const speakeasy = require('speakeasy')
const qrcode = require('qrcode')
const User = require('../models/User')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
const DEFAULT_FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')
const ALLOWED_FRONTEND_ORIGINS = Array.from(new Set([
  ...((process.env.CORS_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean)),
  DEFAULT_FRONTEND_URL,
]))

function normalizeOrigin(urlString) {
  try {
    const url = new URL(urlString)
    return `${url.protocol}//${url.host}`
  } catch {
    return null
  }
}

function resolveFrontendUrl(candidate) {
  if (typeof candidate === 'string' && candidate.trim()) {
    const normalized = normalizeOrigin(candidate.trim())
    if (normalized && ALLOWED_FRONTEND_ORIGINS.includes(normalized)) {
      return normalized
    }
  }
  return DEFAULT_FRONTEND_URL
}

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

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields required' })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = new User({
      name,
      email,
      password: hashedPassword,
      profileData: {}
    })

    await user.save()

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' })

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileData: user.profileData,
        twoFactorEnabled: user.twoFactorEnabled || false,
      },
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ message: 'Server error during signup' })
  }
})

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password, twoFactorToken } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    if (user.twoFactorEnabled) {
      if (!twoFactorToken) {
        return res.json({
          requiresTwoFactor: true,
          message: 'Two-factor authentication code required',
        })
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: String(twoFactorToken),
        window: 1,
      })

      if (!verified) {
        return res.status(401).json({ message: 'Invalid code' })
      }
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' })

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileData: user.profileData || {},
        twoFactorEnabled: user.twoFactorEnabled || false,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error during login' })
  }
})

// GOOGLE AUTH - Initiate
router.get('/google', (req, res, next) => {
  const frontend = typeof req.query.frontend === 'string' ? req.query.frontend : ''
  const redirectTarget = resolveFrontendUrl(frontend)

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: redirectTarget,
  })(req, res, next)
})

// GOOGLE AUTH - Callback
router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    try {
      const token = jwt.sign({ userId: req.user._id }, JWT_SECRET, { expiresIn: '7d' })
      const frontendUrl = resolveFrontendUrl(req.query?.state)
      const redirectUser = {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        twoFactorEnabled: req.user.twoFactorEnabled || false,
      }
      const params = new URLSearchParams({
        token,
        user: JSON.stringify(redirectUser),
      })
      
      // Redirect to frontend with token
      res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`)
    } catch (error) {
      console.error('Google callback error:', error)
      const frontendUrl = resolveFrontendUrl(req.query?.state)
      res.redirect(`${frontendUrl}/login?error=google_auth_failed`)
    }
  }
)

// GET USER PROFILE
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await User.findById(decoded.userId).select('-password -twoFactorSecret')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    console.error('Get user error:', error)
    res.status(401).json({ message: 'Invalid token' })
  }
})

// UPDATE USER PROFILE
router.put('/profile', auth, async (req, res) => {
  try {
    const updateData = {
      'profileData.avatar': req.body.avatar,
      'profileData.age': req.body.age,
      'profileData.gender': req.body.gender,
      'profileData.weight': req.body.weight,
      'profileData.height': req.body.height,
      'profileData.goalWeight': req.body.goalWeight,
      'profileData.activityLevel': req.body.activityLevel,
      'profileData.fitnessGoal': req.body.fitnessGoal,
      'profileData.phone': req.body.phone
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true, runValidators: false }
    ).select('-password -twoFactorSecret')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ message: 'Failed to update profile' })
  }
})

// CHANGE PASSWORD
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' })
    }

    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    user.password = hashedPassword
    await user.save()

    res.json({ message: 'Password changed successfully!' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ message: 'Failed to change password. Please try again.' })
  }
})

// GENERATE 2FA SETUP
router.post('/2fa/generate', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const secret = speakeasy.generateSecret({
      name: `AI Fitness Tracker (${user.email})`,
      length: 20,
    })

    user.twoFactorSecret = secret.base32
    user.twoFactorEnabled = false
    await user.save()

    const qrCode = await qrcode.toDataURL(secret.otpauth_url)

    res.json({
      secret: secret.base32,
      qrCode,
    })
  } catch (error) {
    console.error('Generate 2FA error:', error)
    res.status(500).json({ message: 'Failed to generate 2FA setup' })
  }
})

// VERIFY AND ENABLE 2FA
router.post('/2fa/verify', auth, async (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' })
    }

    const user = await User.findById(req.userId)
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA setup not found. Generate setup first.' })
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: String(token),
      window: 1,
    })

    if (!verified) {
      return res.status(401).json({ success: false, message: 'Invalid verification code' })
    }

    user.twoFactorEnabled = true
    await user.save()

    res.json({ success: true, message: 'Two-factor authentication enabled' })
  } catch (error) {
    console.error('Verify 2FA error:', error)
    res.status(500).json({ success: false, message: 'Failed to verify 2FA' })
  }
})

// DISABLE 2FA
router.post('/2fa/disable', auth, async (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' })
    }

    const user = await User.findById(req.userId)
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ message: 'Two-factor authentication is not enabled' })
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: String(token),
      window: 1,
    })

    if (!verified) {
      return res.status(401).json({ success: false, message: 'Invalid verification code' })
    }

    user.twoFactorEnabled = false
    user.twoFactorSecret = undefined
    await user.save()

    res.json({ success: true, message: 'Two-factor authentication disabled' })
  } catch (error) {
    console.error('Disable 2FA error:', error)
    res.status(500).json({ success: false, message: 'Failed to disable 2FA' })
  }
})

module.exports = router
