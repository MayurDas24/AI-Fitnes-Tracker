// backend/config/passport.js
const GoogleStrategy = require('passport-google-oauth20').Strategy
const User = require('../models/User')

const PORT = process.env.PORT || '5000'
const BACKEND_URL = (process.env.BACKEND_URL || `http://localhost:${PORT}`).replace(/\/$/, '')
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || `${BACKEND_URL}/api/auth/google/callback`

module.exports = function(passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists
          let user = await User.findOne({ email: profile.emails[0].value })

          if (user) {
            // User exists, return user
            return done(null, user)
          } else {
            // Create new user
            user = new User({
              name: profile.displayName,
              email: profile.emails[0].value,
              password: 'google-oauth-' + profile.id, // Not used for Google auth
              profileData: {}
            })

            await user.save()
            return done(null, user)
          }
        } catch (error) {
          console.error('Google OAuth error:', error)
          return done(error, null)
        }
      }
    )
  )
}
