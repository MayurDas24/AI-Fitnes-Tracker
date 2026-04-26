require('dotenv').config()
const mongoose = require('mongoose')

const User = require('../models/User')
const Water = require('../models/Water')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fitness-tracker'

const email = String(process.argv[2] || '').trim().toLowerCase()
const startDateArg = String(process.argv[3] || '').trim()
const endDateArg = String(process.argv[4] || '').trim()
const goalArg = Number(process.argv[5] || 2500)

if (!email) {
  console.error('Usage: node scripts/seed-water-history.js <email> [startDate] [endDate] [goalMl]')
  console.error('Example: node scripts/seed-water-history.js user@example.com 2026-04-01 2026-04-09 2500')
  process.exit(1)
}

const goal = Number.isFinite(goalArg) && goalArg > 0 ? Math.round(goalArg) : 2500

function parseDateOnly(raw) {
  if (!raw) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null
  const d = new Date(`${raw}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function dayKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function buildDateRange(startDate, endDate) {
  const dates = []
  const cursor = new Date(startDate)
  while (cursor <= endDate) {
    dates.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

async function run() {
  await mongoose.connect(MONGO_URI)

  const user = await User.findOne({ email })
  if (!user) {
    throw new Error(`User not found for email: ${email}`)
  }

  let startDate = parseDateOnly(startDateArg)
  let endDate = parseDateOnly(endDateArg)

  if (!startDate || !endDate) {
    endDate = new Date()
    endDate.setHours(0, 0, 0, 0)
    endDate.setDate(endDate.getDate() - 1)

    startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - 6)
  }

  if (startDate > endDate) {
    const tmp = startDate
    startDate = endDate
    endDate = tmp
  }

  const dates = buildDateRange(startDate, endDate)
  const amounts = [1850, 2100, 1950, 2300, 1750, 2400, 2050, 2250, 2000, 2150]

  for (let i = 0; i < dates.length; i += 1) {
    const date = dates[i]
    const dateStr = dayKey(date)
    const amount = amounts[i % amounts.length]

    await Water.findOneAndUpdate(
      { userId: user._id, date: dateStr },
      {
        $set: {
          amount,
          goal,
          createdAt: date,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    )

    console.log(`Seeded water: ${dateStr} -> ${amount}ml / ${goal}ml`)
  }

  const totalCount = await Water.countDocuments({ userId: user._id })
  console.log(`Done. Water records for ${email}: ${totalCount}`)
}

run()
  .catch((error) => {
    console.error('Water history seeding failed:', error.message)
    process.exit(1)
  })
  .finally(async () => {
    await mongoose.connection.close()
  })
