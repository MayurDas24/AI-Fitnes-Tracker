require('dotenv').config()
const mongoose = require('mongoose')

const User = require('../models/User')
const Workout = require('../models/Workout')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fitness-tracker'

const email = String(process.argv[2] || '').trim().toLowerCase()
const requestedDays = Number(process.argv[3] || 3)
const days = Number.isFinite(requestedDays) ? Math.max(1, Math.min(14, Math.round(requestedDays))) : 3

if (!email) {
  console.error('Usage: node scripts/seed-workout-streak.js <email> [days=3]')
  process.exit(1)
}

const dayKey = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

async function run() {
  await mongoose.connect(MONGO_URI)

  const user = await User.findOne({ email })
  if (!user) {
    throw new Error(`User not found: ${email}`)
  }

  const seeded = []

  for (let i = 0; i < days; i += 1) {
    const date = new Date()
    date.setHours(12, 0, 0, 0)
    date.setDate(date.getDate() - i)
    const dateStr = dayKey(date)

    const volume = 4200 - i * 250
    const calories = 410 - i * 20
    const duration = 58 - i * 3

    await Workout.findOneAndUpdate(
      { userId: user._id, date: dateStr },
      {
        $set: {
          userId: user._id,
          date: dateStr,
          exercises: 5,
          completedSets: 15,
          volume,
          calories,
          duration,
          workoutData: [
            { name: 'Barbell Squat', sets: 4, reps: 8, weight: 80 - i * 2 },
            { name: 'Bench Press', sets: 4, reps: 8, weight: 70 - i * 2 },
            { name: 'Lat Pulldown', sets: 3, reps: 12, weight: 55 - i * 2 },
          ],
          createdAt: date,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    )

    seeded.push(dateStr)
  }

  console.log(`Seeded streak workout dates for ${email}: ${seeded.join(', ')}`)
}

run()
  .catch((error) => {
    console.error('Streak seeding failed:', error.message)
    process.exit(1)
  })
  .finally(async () => {
    await mongoose.connection.close()
  })
