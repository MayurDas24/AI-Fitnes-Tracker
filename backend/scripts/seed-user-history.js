require('dotenv').config()
const mongoose = require('mongoose')

const User = require('../models/User')
const Workout = require('../models/Workout')
const Meal = require('../models/Meal')
const Water = require('../models/Water')
const Progress = require('../models/Progress')
const Calculation = require('../models/Calculation')
const BodyAnalysis = require('../models/BodyAnalysis')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fitness-tracker'

const email = (process.argv[2] || '').trim().toLowerCase()
const weight = Number(process.argv[3] || 62)
const height = Number(process.argv[4] || 177)
const age = Number(process.argv[5] || 21)
const fitnessGoal = (process.argv[6] || 'Muscle Gain').trim()

if (!email) {
  console.error('Usage: node scripts/seed-user-history.js <email> [weight] [height] [age] [fitnessGoal]')
  process.exit(1)
}

const dayKey = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().split('T')[0]
const dateFromToday = (offset) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d
}

const calcBmi = (w, hCm) => {
  const h = hCm / 100
  return Number((w / (h * h)).toFixed(1))
}

const calcBmr = (w, hCm, years) => Math.round(10 * w + 6.25 * hCm - 5 * years + 5)

const calcTdee = (bmr, activity = 1.55) => Math.round(bmr * activity)

async function run() {
  await mongoose.connect(MONGO_URI)

  const user = await User.findOne({ email })
  if (!user) {
    throw new Error(`User not found for email: ${email}`)
  }

  const userId = user._id
  const bmi = calcBmi(weight, height)
  const bmr = calcBmr(weight, height, age)
  const tdee = calcTdee(bmr, 1.6)
  const targetCalories = tdee + 250

  user.profileData = {
    ...(user.profileData || {}),
    age,
    weight,
    height,
    goalWeight: Math.round((weight + 6) * 10) / 10,
    fitnessGoal,
    activityLevel: 'Active',
  }
  await user.save()

  const offsets = Array.from({ length: 21 }, (_, i) => i - 20)

  // Workouts: seed for 14 out of 21 days.
  for (const offset of offsets) {
    if (offset % 3 === 0) continue
    const d = dateFromToday(offset)
    const date = dayKey(d)
    const exists = await Workout.findOne({ userId, date })
    if (exists) continue

    const baseVolume = 3200 + (offset + 20) * 110
    const exercises = 6 + ((offset + 21) % 3)
    const completedSets = exercises * 3
    const calories = 260 + ((offset + 21) % 5) * 30
    const duration = 52 + ((offset + 21) % 4) * 7

    await Workout.create({
      userId,
      date,
      exercises,
      completedSets,
      volume: baseVolume,
      calories,
      duration,
      workoutData: [
        { name: 'Compound Lift', sets: 4, reps: 8, weight: 60 + ((offset + 20) % 8) },
        { name: 'Accessory Lift', sets: 3, reps: 12, weight: 30 + ((offset + 20) % 6) },
      ],
      createdAt: d,
    })
  }

  // Meals: seed 3 meals for each day only if that day has no meals yet.
  for (const offset of offsets) {
    const d = dateFromToday(offset)
    const date = dayKey(d)
    const existingCount = await Meal.countDocuments({ userId, date })
    if (existingCount > 0) continue

    const dayBias = (offset + 21) % 5
    const meals = [
      { name: 'Breakfast Oats + Eggs', mealType: 'breakfast', calories: 520 + dayBias * 15, protein: 34, carbs: 58, fat: 16 },
      { name: 'Chicken Rice Bowl', mealType: 'lunch', calories: 690 + dayBias * 18, protein: 48, carbs: 72, fat: 20 },
      { name: 'Salmon + Potatoes', mealType: 'dinner', calories: 760 + dayBias * 12, protein: 52, carbs: 66, fat: 28 },
    ]

    await Meal.insertMany(
      meals.map((m) => ({
        userId,
        date,
        ...m,
        createdAt: d,
      }))
    )
  }

  // Water: upsert all 21 days (includes today for /water/today endpoint).
  for (const offset of offsets) {
    const d = dateFromToday(offset)
    const date = dayKey(d)
    const amount = 1800 + ((offset + 21) % 7) * 180
    await Water.findOneAndUpdate(
      { userId, date },
      {
        $set: {
          amount,
          goal: 3000,
          createdAt: d,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
  }

  // Progress: weekly checkpoints with realistic deviations (not a flat/linear line).
  const progressOffsets = [-20, -14, -10, -7, -4, -2, 0]
  const weightDeviation = [-0.35, 0.12, -0.18, 0.22, -0.08, 0.16, 0]
  const fatDeviation = [0.22, -0.08, 0.12, -0.1, 0.06, -0.05, 0]

  for (let i = 0; i < progressOffsets.length; i += 1) {
    const offset = progressOffsets[i]
    const d = dateFromToday(offset)
    const date = dayKey(d)

    // Baseline trend toward present + small oscillation to mimic real-world variance.
    const baselineWeight = weight - (0 - offset) * 0.02
    const w = Number((baselineWeight + weightDeviation[i]).toFixed(1))

    const baselineFat = 16.8 - (0 - offset) * 0.045
    const bodyFat = Number((baselineFat + fatDeviation[i]).toFixed(1))

    await Progress.findOneAndUpdate(
      { userId, date },
      {
        $set: {
          weight: w,
          bodyFat,
          measurements: {
            chest: 94 + Math.round((offset + 20) / 6),
            waist: 77 - Math.round((offset + 20) / 10),
            hips: 92,
            arms: 33 + Math.round((offset + 20) / 12),
            legs: 53 + Math.round((offset + 20) / 11),
          },
          notes: 'Seeded historical checkpoint with natural variance',
          createdAt: d,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
  }

  // Calculations: create one set if not already present.
  const hasCalculations = await Calculation.countDocuments({ userId })
  if (hasCalculations < 4) {
    const now = new Date()
    await Calculation.create({
      userId,
      calculationType: 'BMI',
      inputs: { weight, height },
      results: { bmi, category: bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese' },
      date: now,
      createdAt: now,
    })
    await Calculation.create({
      userId,
      calculationType: 'BMR',
      inputs: { weight, height, age, gender: 'male' },
      results: { bmr },
      date: now,
      createdAt: now,
    })
    await Calculation.create({
      userId,
      calculationType: 'TDEE',
      inputs: { bmr, activityLevel: 'active' },
      results: { tdee },
      date: now,
      createdAt: now,
    })
    await Calculation.create({
      userId,
      calculationType: 'MACROS',
      inputs: { goal: 'muscle_gain', calories: targetCalories },
      results: {
        calories: targetCalories,
        protein: Math.round(weight * 2.2),
        carbs: Math.round((targetCalories * 0.45) / 4),
        fat: Math.round((targetCalories * 0.25) / 9),
      },
      date: now,
      createdAt: now,
    })
  }

  // Body analysis: seed baseline reports if missing.
  const bodyCount = await BodyAnalysis.countDocuments({ userId })
  if (bodyCount === 0) {
    await BodyAnalysis.create({
      userId,
      name: 'Baseline Physique Scan',
      focusAreas: ['Chest', 'Back', 'Shoulders', 'Arms'],
      trainingPlan: JSON.stringify({
        summary: 'Prioritize upper-body hypertrophy with progressive overload and strict technique.',
        weeklyFocus: ['Push Strength', 'Pull Hypertrophy', 'Legs + Core', 'Upper Accessory'],
      }),
      createdAt: dateFromToday(-6),
      date: dateFromToday(-6),
    })

    await BodyAnalysis.create({
      userId,
      name: 'Posture + Core Follow-up',
      focusAreas: ['Core', 'Posture', 'Glutes'],
      trainingPlan: JSON.stringify({
        summary: 'Add anti-rotation core work, glute activation, and scapular control drills.',
        weeklyFocus: ['Core Stability', 'Posterior Chain', 'Mobility Recovery'],
      }),
      createdAt: dateFromToday(-1),
      date: dateFromToday(-1),
    })
  }

  console.log(`Seed complete for ${email}`)
  console.log(`Profile -> weight ${weight}kg, height ${height}cm, age ${age}, goal ${fitnessGoal}`)
}

run()
  .catch((err) => {
    console.error('Seeding failed:', err.message)
    process.exit(1)
  })
  .finally(async () => {
    await mongoose.connection.close()
  })
