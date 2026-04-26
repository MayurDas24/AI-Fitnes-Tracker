require('dotenv').config()
const mongoose = require('mongoose')

const User = require('../models/User')
const Workout = require('../models/Workout')
const Meal = require('../models/Meal')
const Water = require('../models/Water')
const Progress = require('../models/Progress')
const Calculation = require('../models/Calculation')
const BodyAnalysis = require('../models/BodyAnalysis')
const Favorite = require('../models/Favorite')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fitness-tracker'

const email = String(process.argv[2] || '').trim().toLowerCase()
const requestedDays = Number(process.argv[3] || 120)
const days = Number.isFinite(requestedDays) ? Math.max(30, Math.min(365, Math.round(requestedDays))) : 120
const shouldReset = process.argv.includes('--reset')

if (!email) {
  console.error('Usage: node scripts/seed-rich-demo-data.js <email> [days=120] [--reset]')
  process.exit(1)
}

const EXERCISE_POOL = [
  { id: 'bench-press', name: 'Barbell Bench Press', baseReps: 8, baseWeight: 70 },
  { id: 'incline-bench', name: 'Incline Bench Press', baseReps: 10, baseWeight: 60 },
  { id: 'deadlift', name: 'Barbell Deadlift', baseReps: 5, baseWeight: 110 },
  { id: 'lat-pulldown', name: 'Lat Pulldown', baseReps: 12, baseWeight: 55 },
  { id: 'seated-row', name: 'Seated Cable Row', baseReps: 10, baseWeight: 50 },
  { id: 'squat', name: 'Barbell Squat', baseReps: 6, baseWeight: 90 },
  { id: 'leg-press', name: 'Leg Press', baseReps: 10, baseWeight: 160 },
  { id: 'rdl', name: 'Romanian Deadlift', baseReps: 8, baseWeight: 90 },
  { id: 'ohp', name: 'Overhead Press', baseReps: 8, baseWeight: 45 },
  { id: 'db-press', name: 'Seated DB Press', baseReps: 10, baseWeight: 22 },
  { id: 'lat-raise', name: 'Lateral Raise', baseReps: 14, baseWeight: 10 },
  { id: 'bb-curl', name: 'Barbell Curl', baseReps: 10, baseWeight: 32 },
  { id: 'pushdown', name: 'Cable Pushdown', baseReps: 12, baseWeight: 30 },
  { id: 'crunch', name: 'Crunches', baseReps: 20, baseWeight: 0 },
  { id: 'plank', name: 'Plank', baseReps: 1, baseWeight: 0 },
  { id: 'bulgarian', name: 'Bulgarian Split Squat', baseReps: 10, baseWeight: 20 },
  { id: 'hip-thrust', name: 'Barbell Hip Thrust', baseReps: 10, baseWeight: 95 },
  { id: 'face-pull', name: 'Face Pull', baseReps: 15, baseWeight: 24 },
  { id: 'pullup', name: 'Pull-Up', baseReps: 8, baseWeight: 0 },
  { id: 'pushup', name: 'Push-Up', baseReps: 18, baseWeight: 0 },
]

const FAVORITES = [
  ['bench-press', 'Barbell Bench Press', 'chest'],
  ['incline-bench', 'Incline Bench Press', 'chest'],
  ['dumbell-press', 'Flat Dumbbell Press', 'chest'],
  ['deadlift', 'Barbell Deadlift', 'back'],
  ['pullup', 'Pull-Up', 'back'],
  ['lat-pulldown', 'Lat Pulldown', 'back'],
  ['seated-row', 'Seated Cable Row', 'back'],
  ['squat', 'Barbell Squat', 'legs'],
  ['leg-press', 'Leg Press', 'legs'],
  ['rdl', 'Romanian Deadlift', 'legs'],
  ['bulgarian', 'Bulgarian Split Squat', 'legs'],
  ['hip-thrust', 'Barbell Hip Thrust', 'legs'],
  ['ohp', 'Overhead Press', 'shoulders'],
  ['lat-raise', 'Lateral Raise', 'shoulders'],
  ['face-pull', 'Face Pull', 'shoulders'],
  ['bb-curl', 'Barbell Curl', 'arms'],
  ['hammer', 'Hammer Curl', 'arms'],
  ['pushdown', 'Cable Pushdown', 'arms'],
  ['skull', 'Skullcrushers', 'arms'],
  ['crunch', 'Crunches', 'core'],
  ['leg-raise', 'Hanging Leg Raise', 'core'],
  ['plank', 'Plank', 'core'],
  ['russian-twist', 'Russian Twist', 'core'],
  ['m-climber', 'Mountain Climber', 'core'],
  ['cable-crunch', 'Cable Crunch', 'core'],
  ['db-press', 'Seated DB Press', 'shoulders'],
  ['pushup', 'Push-Up', 'chest'],
  ['dips', 'Chest Dips', 'chest'],
  ['lunge', 'Walking Lunge', 'legs'],
  ['goblet-squat', 'Goblet Squat', 'legs'],
]

const ANALYSIS_FOCUS = [
  ['Chest', 'Shoulders', 'Arms'],
  ['Back', 'Core', 'Posture'],
  ['Glutes', 'Legs', 'Core'],
  ['Arms', 'Shoulders', 'Back'],
  ['Legs', 'Posture', 'Core'],
]

const ANALYSIS_NAMES = [
  'Baseline Symmetry Scan',
  'Upper Body Density Review',
  'Posterior Chain Progress Check',
  'Core Stability Snapshot',
  'Fatigue and Recovery Scan',
  'Hypertrophy Balance Audit',
  'Mobility and Posture Pass',
  'Conditioning Readiness Review',
  'Strength Plateau Diagnostic',
  'Recomposition Trend Report',
]

const MEAL_BANK = {
  breakfast: [
    'Greek Yogurt Protein Bowl',
    'Egg White Omelette + Toast',
    'Overnight Oats with Berries',
    'High Protein Pancakes',
  ],
  lunch: [
    'Chicken Rice Power Bowl',
    'Turkey Wrap + Side Salad',
    'Beef Burrito Bowl',
    'Tofu Quinoa Stir Fry',
  ],
  dinner: [
    'Salmon + Potatoes + Greens',
    'Steak + Sweet Potato + Veg',
    'Chicken Pasta Primavera',
    'Shrimp Rice Noodle Stir Fry',
  ],
  snack: [
    'Protein Shake + Banana',
    'Cottage Cheese + Pineapple',
    'Peanut Butter Rice Cakes',
    'Greek Yogurt + Honey',
  ],
}

const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const noise = (seed) => {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return value - Math.floor(value)
}

const randInt = (seed, min, max) => Math.floor(noise(seed) * (max - min + 1)) + min

const toDayKey = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const dateFromOffset = (offset) => {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + offset)
  return date
}

const calcBmi = (weightKg, heightCm) => {
  const h = heightCm / 100
  return Number((weightKg / (h * h)).toFixed(1))
}

const calcBmr = (weightKg, heightCm, age, gender = 'male') => {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return Math.round(gender === 'female' ? base - 161 : base + 5)
}

const buildWorkoutData = (daySeed) => {
  const count = randInt(daySeed + 1, 5, 8)
  const workoutData = []

  for (let i = 0; i < count; i += 1) {
    const pick = EXERCISE_POOL[(daySeed + i * 7) % EXERCISE_POOL.length]
    const setCount = randInt(daySeed + i * 11, 3, 5)
    const sets = []

    for (let setIndex = 0; setIndex < setCount; setIndex += 1) {
      const reps = Math.max(4, pick.baseReps + randInt(daySeed + i * 17 + setIndex, -2, 3))
      const weight = Math.max(0, pick.baseWeight + randInt(daySeed + i * 19 + setIndex, -8, 10))
      sets.push({ reps, weight, completed: true })
    }

    workoutData.push({
      id: pick.id,
      name: pick.name,
      sets,
    })
  }

  return workoutData
}

const computeWorkoutVolume = (workoutData) => {
  return workoutData.reduce(
    (sum, exercise) =>
      sum +
      exercise.sets.reduce((setSum, set) => {
        const reps = Number(set.reps) || 0
        const weight = Number(set.weight) || 0
        return setSum + reps * weight
      }, 0),
    0
  )
}

async function run() {
  await mongoose.connect(MONGO_URI)

  const user = await User.findOne({ email })
  if (!user) {
    throw new Error(`User not found for email: ${email}`)
  }

  const userId = user._id

  if (shouldReset) {
    await Promise.all([
      Workout.deleteMany({ userId }),
      Meal.deleteMany({ userId }),
      Water.deleteMany({ userId }),
      Progress.deleteMany({ userId }),
      Calculation.deleteMany({ userId }),
      BodyAnalysis.deleteMany({ userId }),
      Favorite.deleteMany({ userId }),
    ])
  }

  const workoutOps = []
  const mealOps = []
  const waterOps = []
  const progressOps = []
  const calculationOps = []
  const analysisOps = []
  const favoriteOps = []

  const totalDays = days
  const baseWeight = 72.8
  const targetWeight = 66.4
  const height = 177
  const age = 21
  const activityLevel = 'active'
  const activityFactor = ACTIVITY_FACTORS[activityLevel]

  for (let offset = -totalDays + 1; offset <= 0; offset += 1) {
    const dayIndex = offset + totalDays - 1
    const currentDate = dateFromOffset(offset)
    const dayKey = toDayKey(currentDate)

    const trend = dayIndex / Math.max(1, totalDays - 1)
    const weight = Number((baseWeight - (baseWeight - targetWeight) * trend + (noise(dayIndex + 33) - 0.5) * 0.8).toFixed(1))
    const bodyFat = Number((22.6 - 6.1 * trend + (noise(dayIndex + 39) - 0.5) * 0.6).toFixed(1))

    // Workout on roughly 5 out of every 7 days.
    if (noise(dayIndex + 7) > 0.27) {
      const workoutData = buildWorkoutData(dayIndex + 101)
      const volume = computeWorkoutVolume(workoutData)
      const completedSets = workoutData.reduce((sum, ex) => sum + ex.sets.length, 0)
      const duration = clamp(Math.round(42 + completedSets * 2.4 + randInt(dayIndex + 55, -8, 12)), 35, 120)
      const calories = clamp(Math.round(210 + duration * 4.3 + randInt(dayIndex + 61, -30, 50)), 260, 860)

      workoutOps.push({
        updateOne: {
          filter: { userId, date: dayKey },
          update: {
            $set: {
              userId,
              date: dayKey,
              exercises: workoutData.length,
              completedSets,
              volume,
              calories,
              duration,
              workoutData,
              createdAt: currentDate,
            },
          },
          upsert: true,
        },
      })
    }

    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack']
    const baseCals = { breakfast: 560, lunch: 760, dinner: 840, snack: 330 }
    const basePro = { breakfast: 36, lunch: 54, dinner: 60, snack: 22 }
    const baseCarbs = { breakfast: 58, lunch: 78, dinner: 84, snack: 28 }
    const baseFat = { breakfast: 18, lunch: 24, dinner: 28, snack: 12 }
    const mealHours = { breakfast: 8, lunch: 13, dinner: 19, snack: 16 }

    mealTypes.forEach((mealType, mealIndex) => {
      const menu = MEAL_BANK[mealType]
      const name = menu[(dayIndex + mealIndex * 3) % menu.length]
      const calories = clamp(baseCals[mealType] + randInt(dayIndex + 201 + mealIndex, -90, 110), 180, 1200)
      const protein = clamp(basePro[mealType] + randInt(dayIndex + 211 + mealIndex, -8, 10), 8, 90)
      const carbs = clamp(baseCarbs[mealType] + randInt(dayIndex + 221 + mealIndex, -14, 16), 8, 140)
      const fat = clamp(baseFat[mealType] + randInt(dayIndex + 231 + mealIndex, -5, 6), 2, 60)
      const mealCreatedAt = new Date(currentDate)
      mealCreatedAt.setHours(mealHours[mealType], randInt(dayIndex + 241 + mealIndex, 0, 55), 0, 0)

      mealOps.push({
        updateOne: {
          filter: { userId, date: dayKey, mealType, name },
          update: {
            $set: {
              userId,
              date: dayKey,
              name,
              calories,
              protein,
              carbs,
              fat,
              mealType,
              createdAt: mealCreatedAt,
            },
          },
          upsert: true,
        },
      })
    })

    const waterGoal = 3200
    const waterAmount = clamp(
      Math.round(1950 + (noise(dayIndex + 301) - 0.45) * 1300 + (dayIndex % 5 === 0 ? 220 : 0)),
      1200,
      4200
    )

    waterOps.push({
      updateOne: {
        filter: { userId, date: dayKey },
        update: {
          $set: {
            userId,
            date: dayKey,
            amount: waterAmount,
            goal: waterGoal,
            createdAt: currentDate,
          },
        },
        upsert: true,
      },
    })

    if (dayIndex % 3 === 0) {
      const entryDate = new Date(currentDate)
      entryDate.setHours(21, randInt(dayIndex + 401, 0, 45), 0, 0)
      const chest = Number((97.2 + (noise(dayIndex + 421) - 0.5) * 2.2 + trend * 1.4).toFixed(1))
      const waist = Number((88.4 - trend * 9.1 + (noise(dayIndex + 431) - 0.5) * 1.4).toFixed(1))
      const hips = Number((96.2 - trend * 2.2 + (noise(dayIndex + 441) - 0.5) * 1.4).toFixed(1))
      const arms = Number((35.0 + trend * 2.0 + (noise(dayIndex + 451) - 0.5) * 1.1).toFixed(1))
      const legs = Number((56.0 + trend * 2.7 + (noise(dayIndex + 461) - 0.5) * 1.2).toFixed(1))

      const photos = []
      if (dayIndex % 15 === 0) {
        photos.push(`Front||https://picsum.photos/seed/front-${dayKey}/768/1024`)
      }
      if (dayIndex % 30 === 0) {
        photos.push(`Back||https://picsum.photos/seed/back-${dayKey}/768/1024`)
      }

      progressOps.push({
        updateOne: {
          filter: { userId, date: dayKey },
          update: {
            $set: {
              userId,
              date: dayKey,
              weight,
              bodyFat,
              measurements: {
                chest,
                waist,
                hips,
                arms,
                legs,
              },
              photos,
              notes: `Checkpoint ${dayIndex + 1}: training consistency ${randInt(dayIndex + 481, 72, 96)}%`,
              createdAt: entryDate,
            },
          },
          upsert: true,
        },
      })
    }

    if (dayIndex % 6 === 0) {
      const bmi = calcBmi(weight, height)
      const bmr = calcBmr(weight, height, age, 'male')
      const tdee = Math.round(bmr * activityFactor)
      const goalCalories = Math.round(tdee - 220)
      const protein = Math.round(weight * 2.1)
      const fat = Math.round((goalCalories * 0.27) / 9)
      const carbs = Math.round((goalCalories - protein * 4 - fat * 9) / 4)
      const calcDate = new Date(`${dayKey}T14:00:00.000Z`)

      calculationOps.push(
        {
          updateOne: {
            filter: { userId, calculationType: 'BMI', date: calcDate },
            update: {
              $set: {
                userId,
                calculationType: 'BMI',
                inputs: { weight, height },
                results: {
                  bmi,
                  category: bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese',
                },
                date: calcDate,
                createdAt: calcDate,
              },
            },
            upsert: true,
          },
        },
        {
          updateOne: {
            filter: { userId, calculationType: 'BMR', date: calcDate },
            update: {
              $set: {
                userId,
                calculationType: 'BMR',
                inputs: { weight, height, age, gender: 'male' },
                results: { bmr },
                date: calcDate,
                createdAt: calcDate,
              },
            },
            upsert: true,
          },
        },
        {
          updateOne: {
            filter: { userId, calculationType: 'TDEE', date: calcDate },
            update: {
              $set: {
                userId,
                calculationType: 'TDEE',
                inputs: { bmr, activityLevel },
                results: { tdee },
                date: calcDate,
                createdAt: calcDate,
              },
            },
            upsert: true,
          },
        },
        {
          updateOne: {
            filter: { userId, calculationType: 'MACROS', date: calcDate },
            update: {
              $set: {
                userId,
                calculationType: 'MACROS',
                inputs: { goal: 'recomposition', calories: goalCalories },
                results: {
                  calories: goalCalories,
                  protein,
                  carbs,
                  fat,
                },
                date: calcDate,
                createdAt: calcDate,
              },
            },
            upsert: true,
          },
        }
      )
    }
  }

  for (let i = 0; i < ANALYSIS_NAMES.length; i += 1) {
    const offset = -Math.min(totalDays - 1, i * 12)
    const analysisDate = dateFromOffset(offset)
    const dayKey = toDayKey(analysisDate)
    const focusAreas = ANALYSIS_FOCUS[i % ANALYSIS_FOCUS.length]
    const name = `${ANALYSIS_NAMES[i]} (${dayKey})`

    const trainingPlan = JSON.stringify({
      goal: i % 2 === 0 ? 'recomposition' : 'muscle_gain',
      experience: i % 3 === 0 ? 'intermediate' : 'advanced',
      observations: [
        i % 2 === 0 ? 'Rounded shoulders' : 'Lower body underdeveloped',
        i % 3 === 0 ? 'Weak core control' : 'Uneven left-right balance',
      ],
      report: {
        summary: `Cycle ${i + 1} suggests prioritizing ${focusAreas.join(', ')} while maintaining weekly overload progression.`,
        priorityAreas: focusAreas.map((area, areaIndex) => ({
          area,
          priority: areaIndex === 0 ? 'high' : 'medium',
          reason: `Mapped to trend data from cycle ${i + 1}.`,
          weeklySets: areaIndex === 0 ? 16 : 12,
        })),
        actions: [
          'Keep two high-quality compound sessions each week.',
          'Add one mobility/recovery day to protect progression.',
          'Track top-set performance and body metrics every week.',
        ],
        weeklyFocus: [
          { day: 'Day 1', focus: `${focusAreas[0]} heavy strength` },
          { day: 'Day 2', focus: `${focusAreas[1]} hypertrophy` },
          { day: 'Day 3', focus: `${focusAreas[2]} recovery and stability` },
        ],
        cautions: ['Auto-generated guidance only; adapt with coach feedback.'],
      },
    })

    analysisOps.push({
      updateOne: {
        filter: { userId, name },
        update: {
          $set: {
            userId,
            name,
            photoUrl: `https://picsum.photos/seed/analysis-${dayKey}/900/1200`,
            focusAreas,
            trainingPlan,
            date: analysisDate,
            createdAt: analysisDate,
          },
        },
        upsert: true,
      },
    })
  }

  FAVORITES.forEach(([exerciseId, exerciseName, category], idx) => {
    const createdAt = dateFromOffset(-Math.min(totalDays - 1, idx * 2))
    favoriteOps.push({
      updateOne: {
        filter: { userId, exerciseId },
        update: {
          $set: {
            userId,
            exerciseId,
            exerciseName,
            category,
            createdAt,
          },
        },
        upsert: true,
      },
    })
  })

  const finalWeight = Number((baseWeight - (baseWeight - targetWeight) + (noise(totalDays + 9) - 0.5) * 0.4).toFixed(1))
  user.profileData = {
    ...(user.profileData || {}),
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=0f172a&color=f8fafc`,
    age,
    gender: 'male',
    height,
    weight: finalWeight,
    goalWeight: 64,
    fitnessGoal: 'Recomposition',
    activityLevel: 'Very Active',
    phone: (user.profileData && user.profileData.phone) || '+1 555 0147',
  }
  await user.save()

  await Promise.all([
    workoutOps.length ? Workout.bulkWrite(workoutOps, { ordered: false }) : Promise.resolve(),
    mealOps.length ? Meal.bulkWrite(mealOps, { ordered: false }) : Promise.resolve(),
    waterOps.length ? Water.bulkWrite(waterOps, { ordered: false }) : Promise.resolve(),
    progressOps.length ? Progress.bulkWrite(progressOps, { ordered: false }) : Promise.resolve(),
    calculationOps.length ? Calculation.bulkWrite(calculationOps, { ordered: false }) : Promise.resolve(),
    analysisOps.length ? BodyAnalysis.bulkWrite(analysisOps, { ordered: false }) : Promise.resolve(),
    favoriteOps.length ? Favorite.bulkWrite(favoriteOps, { ordered: false }) : Promise.resolve(),
  ])

  const [workoutsCount, mealsCount, waterCount, progressCount, calculationsCount, analysesCount, favoritesCount] = await Promise.all([
    Workout.countDocuments({ userId }),
    Meal.countDocuments({ userId }),
    Water.countDocuments({ userId }),
    Progress.countDocuments({ userId }),
    Calculation.countDocuments({ userId }),
    BodyAnalysis.countDocuments({ userId }),
    Favorite.countDocuments({ userId }),
  ])

  console.log(`Rich demo seed complete for ${email}`)
  console.log(`Days generated: ${totalDays}`)
  console.log('Collection counts:')
  console.log(`- workouts: ${workoutsCount}`)
  console.log(`- meals: ${mealsCount}`)
  console.log(`- water: ${waterCount}`)
  console.log(`- progress: ${progressCount}`)
  console.log(`- calculations: ${calculationsCount}`)
  console.log(`- bodyAnalyses: ${analysesCount}`)
  console.log(`- favorites: ${favoritesCount}`)
}

run()
  .catch((error) => {
    console.error('Rich seeding failed:', error.message)
    process.exit(1)
  })
  .finally(async () => {
    await mongoose.connection.close()
  })
