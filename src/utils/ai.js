// src/utils/ai.js
// ✅ Using GROQ API - 14,400 requests/day FREE!
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

if (!GROQ_API_KEY) {
  console.warn('AI utility running in fallback mode: VITE_GROQ_API_KEY not found')
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

// ============================================================
// FALLBACK DATA (used only when API fails)
// ============================================================
const FALLBACK_WORKOUTS = {
  full_gym: {
    muscle_gain: [
      { name: 'Barbell Bench Press', sets: '4', reps: '8-12', equipment: 'Barbell', notes: 'Focus on mind-muscle connection' },
      { name: 'Barbell Squat', sets: '4', reps: '8-12', equipment: 'Barbell', notes: 'Keep chest up' },
      { name: 'Deadlift', sets: '3', reps: '5-8', equipment: 'Barbell', notes: 'Neutral spine throughout' },
      { name: 'Pull-ups', sets: '3', reps: '8-12', equipment: 'Bodyweight', notes: 'Full range of motion' },
      { name: 'Overhead Press', sets: '3', reps: '8-10', equipment: 'Barbell', notes: 'Brace core tight' }
    ],
    weight_loss: [
      { name: 'Kettlebell Swings', sets: '4', reps: '15-20', equipment: 'Kettlebell', notes: 'Hip hinge movement' },
      { name: 'Box Jumps', sets: '3', reps: '10-12', equipment: 'Box', notes: 'Land softly' },
      { name: 'Battle Ropes', sets: '3', reps: '30 sec', equipment: 'Ropes', notes: 'Maintain rhythm' },
      { name: 'Barbell Complex', sets: '3', reps: '6 each', equipment: 'Barbell', notes: 'No rest between movements' }
    ]
  },
  home: {
    muscle_gain: [
      { name: 'Push-ups', sets: '4', reps: '15-20', equipment: 'Bodyweight', notes: 'Chest to floor' },
      { name: 'Dumbbell Rows', sets: '4', reps: '10-15', equipment: 'Dumbbells', notes: 'Elbow close to body' },
      { name: 'Dumbbell Squats', sets: '4', reps: '12-15', equipment: 'Dumbbells', notes: 'Knees track over toes' },
      { name: 'Dumbbell Shoulder Press', sets: '3', reps: '10-12', equipment: 'Dumbbells', notes: 'Controlled tempo' }
    ],
    weight_loss: [
      { name: 'Burpees', sets: '5', reps: '10-15', equipment: 'Bodyweight', notes: 'Explosive movement' },
      { name: 'Mountain Climbers', sets: '4', reps: '30 sec', equipment: 'Bodyweight', notes: 'Keep hips level' },
      { name: 'Jump Squats', sets: '4', reps: '15', equipment: 'Bodyweight', notes: 'Land with soft knees' }
    ]
  },
  bodyweight: {
    muscle_gain: [
      { name: 'Push-ups', sets: '5', reps: '15-20', equipment: 'Bodyweight', notes: 'Various hand positions' },
      { name: 'Pull-ups', sets: '4', reps: '8-12', equipment: 'Bar', notes: 'Dead hang start' },
      { name: 'Pistol Squats', sets: '3', reps: '8 per leg', equipment: 'Bodyweight', notes: 'Use support if needed' },
      { name: 'Dips', sets: '3', reps: '10-15', equipment: 'Parallel bars', notes: 'Lean forward for chest' }
    ],
    weight_loss: [
      { name: 'Burpees', sets: '5', reps: '10-15', equipment: 'Bodyweight', notes: 'Max effort' },
      { name: 'High Knees', sets: '4', reps: '30 sec', equipment: 'Bodyweight', notes: 'Drive knees up' },
      { name: 'Plank to Push-up', sets: '3', reps: '10-12', equipment: 'Bodyweight', notes: 'Stable hips' }
    ]
  }
}

const EXPERIENCE_NAME_REPLACEMENTS = {
  beginner: {
    'Deadlift': 'Romanian Deadlift',
    'Pull-ups': 'Assisted Pull-ups',
    'Pistol Squats': 'Assisted Split Squat',
    'Box Jumps': 'Step-ups',
    'Barbell Complex': 'Dumbbell Complex',
    'Burpees': 'Half Burpees',
  },
  advanced: {
    'Push-ups': 'Weighted Push-ups',
    'Barbell Squat': 'Paused Barbell Squat',
    'Overhead Press': 'Push Press',
    'Dumbbell Squats': 'Tempo Dumbbell Squat',
    'Mountain Climbers': 'Sprinter Mountain Climbers',
  },
}

const GOAL_FINISHERS = {
  full_gym: {
    muscle_gain: {
      name: 'Loaded Carry',
      sets: '4',
      reps: '30-40m',
      equipment: 'Dumbbells',
      notes: 'Heavy carry for grip and trunk strength',
    },
    weight_loss: {
      name: 'Rower Intervals',
      sets: '6',
      reps: '30 sec hard / 30 sec easy',
      equipment: 'Rower',
      notes: 'Maintain high effort each round',
    },
  },
  home: {
    muscle_gain: {
      name: 'Dumbbell Carry',
      sets: '4',
      reps: '30-40m',
      equipment: 'Dumbbells',
      notes: 'Slow controlled walk',
    },
    weight_loss: {
      name: 'Jump Rope Intervals',
      sets: '6',
      reps: '45 sec on / 15 sec off',
      equipment: 'Jump Rope',
      notes: 'Keep a steady fast cadence',
    },
  },
  bodyweight: {
    muscle_gain: {
      name: 'Tempo Push-up Finisher',
      sets: '3',
      reps: 'AMRAP',
      equipment: 'Bodyweight',
      notes: '3-second lower, 1-second pause',
    },
    weight_loss: {
      name: 'EMOM Cardio Burst',
      sets: '10',
      reps: '20 sec burpees + 40 sec march',
      equipment: 'Bodyweight',
      notes: 'Repeat every minute on the minute',
    },
  },
}

const toSetRange = (value) => {
  const match = String(value || '').match(/(\d+)(?:\s*-\s*(\d+))?/)
  if (!match) return [3, 3]
  const min = Number(match[1])
  const max = Number(match[2] || match[1])
  return [min, max]
}

const formatSetRange = (min, max) => {
  return min === max ? `${min}` : `${min}-${max}`
}

const tuneByExperience = (exercises, experience, goal) => {
  return exercises.map((exercise) => {
    const next = { ...exercise }
    const replacements = EXPERIENCE_NAME_REPLACEMENTS[experience] || {}
    if (replacements[next.name]) {
      next.name = replacements[next.name]
    }

    const [setMin, setMax] = toSetRange(next.sets)
    if (experience === 'beginner') {
      const min = Math.max(2, setMin - 1)
      const max = Math.max(min, Math.min(3, setMax))
      next.sets = formatSetRange(min, max)
      next.notes = `${next.notes || ''}${next.notes ? ' | ' : ''}Beginner: prioritize form and controlled tempo`
      if (goal === 'weight_loss' && !/sec/i.test(String(next.reps))) {
        next.reps = '10-15'
      }
    }

    if (experience === 'advanced') {
      const min = Math.min(6, setMin + 1)
      const max = Math.min(6, setMax + 1)
      next.sets = formatSetRange(min, Math.max(min, max))
      next.notes = `${next.notes || ''}${next.notes ? ' | ' : ''}Advanced: push intensity near technical failure`
      if (goal === 'muscle_gain' && !/sec|m/i.test(String(next.reps))) {
        next.reps = '6-10'
      }
    }

    return next
  })
}

const detectExperience = (promptLower) => {
  if (promptLower.includes('beginner')) return 'beginner'
  if (promptLower.includes('advanced')) return 'advanced'
  return 'intermediate'
}

const detectGoal = (promptLower) => {
  const weightLossHints = [
    'weight loss',
    'lose weight',
    'fat loss',
    'lose body fat',
    'body fat',
    'burn fat',
    'cutting',
    'cut phase',
  ]
  if (weightLossHints.some((hint) => promptLower.includes(hint))) return 'weight_loss'
  return 'muscle_gain'
}

const FALLBACK_MEALS = {
  high_protein: [
    { name: 'Grilled Chicken Bowl', calories: 450, protein: 40, carbs: 35, fat: 12, description: 'With brown rice and steamed broccoli' },
    { name: 'Greek Yogurt Parfait', calories: 300, protein: 25, carbs: 28, fat: 6, description: 'With mixed berries and granola' },
    { name: 'Tuna Salad', calories: 350, protein: 35, carbs: 20, fat: 14, description: 'With whole grain crackers and avocado' },
    { name: 'Egg White Omelette', calories: 280, protein: 30, carbs: 8, fat: 10, description: 'With spinach, mushrooms, and feta' }
  ],
  low_cal: [
    { name: 'Veggie Omelette', calories: 250, protein: 20, carbs: 10, fat: 14, description: '3 eggs with spinach and peppers' },
    { name: 'Protein Smoothie', calories: 280, protein: 30, carbs: 25, fat: 5, description: 'Whey protein, banana, almond milk' },
    { name: 'Turkey Lettuce Wraps', calories: 220, protein: 25, carbs: 8, fat: 9, description: 'Ground turkey with lettuce and salsa' }
  ]
}

// ============================================================
// MAIN GROQ API FUNCTION (for WorkoutPlanGenerator, DietTracker)
// ============================================================
export const generateWithAI = async (prompt, type = 'workout') => {
  console.log(`🤖 Calling Groq API (type: ${type})...`)

  if (!GROQ_API_KEY) {
    console.warn('GROQ_API_KEY missing, using local fallback response')
    return fallbackResponse(prompt, type)
  }

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2048,
      })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      console.error('❌ Groq API error:', err?.error?.message || response.status)
      return fallbackResponse(prompt, type)
    }

    const data = await response.json()
    const text = data?.choices?.[0]?.message?.content

    if (!text) {
      console.error('❌ No text in Groq response')
      return fallbackResponse(prompt, type)
    }

    const cleaned = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim()
    console.log('✅ Groq responded successfully')
    return cleaned

  } catch (error) {
    console.error('❌ Groq fetch failed:', error.message)
    return fallbackResponse(prompt, type)
  }
}

function fallbackResponse(prompt, type) {
  console.warn('⚠️ Using fallback data')

  if (type === 'workout') {
    const promptLower = prompt.toLowerCase()
    const isHome = promptLower.includes('home')
    const isBodyweight = promptLower.includes('bodyweight')
    const experience = detectExperience(promptLower)
    const goal = detectGoal(promptLower)

    const equipment = isBodyweight ? 'bodyweight' : isHome ? 'home' : 'full_gym'
    const baseExercises = FALLBACK_WORKOUTS[equipment][goal] || FALLBACK_WORKOUTS.full_gym.muscle_gain
    const tunedExercises = tuneByExperience(baseExercises, experience, goal)
    const finisher = GOAL_FINISHERS[equipment]?.[goal]
    const payload = finisher ? [...tunedExercises, finisher] : tunedExercises

    return JSON.stringify(payload)
  }

  if (type === 'meal') {
    const isHighProtein = prompt.toLowerCase().includes('protein')
    return JSON.stringify(isHighProtein ? FALLBACK_MEALS.high_protein : FALLBACK_MEALS.low_cal)
  }

  return null
}

export default generateWithAI
