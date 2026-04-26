import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle,
  ChevronRight,
  Download,
  Dumbbell,
  Flame,
  History,
  RefreshCw,
  Sparkles,
  Target,
  Calendar,
  Timer,
} from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { generateWithAI } from '../utils/ai'
import { exportWorkoutPlanToPDF } from '../utils/exportPDF'

const CALC_COLORS = {
  page: 'linear-gradient(120deg, #0b0f14 0%, #0f141b 35%, #121821 70%, #0b0f14 100%)',
  accent: '#d1d5db',
  signal: '#ef4444',
}

const MATTE = {
  panel: 'linear-gradient(155deg, rgba(255,255,255,0.08) 0%, rgba(26,32,44,0.92) 30%, rgba(9,12,18,0.98) 100%)',
  tile: 'linear-gradient(150deg, rgba(255,255,255,0.07) 0%, rgba(16,22,33,0.95) 45%, rgba(6,9,14,1) 100%)',
  inset: 'linear-gradient(170deg, rgba(255,255,255,0.03) 0%, rgba(20,26,34,0.95) 36%, rgba(11,15,21,1) 100%)',
  borderSoft: 'rgba(255,255,255,0.10)',
}

const STORAGE_KEY = 'generatedWorkoutPlan'

const DEFAULT_FORM = {
  goal: 'muscle_gain',
  experience: 'intermediate',
  daysPerWeek: 4,
  duration: 60,
  equipment: 'full_gym',
}

const DAY_SPLITS = {
  muscle_gain: [
    'Upper Body Push',
    'Lower Body Strength',
    'Upper Body Pull',
    'Lower Body & Core',
    'Full Body Power',
    'Conditioning & Core',
  ],
  weight_loss: [
    'Metabolic Full Body',
    'Lower Body + HIIT',
    'Upper Body Circuit',
    'Conditioning Intervals',
    'Full Body Density',
    'Core + Cardio',
  ],
}

const EXPERIENCE = ['beginner', 'intermediate', 'advanced']
const EQUIPMENT = [
  { value: 'full_gym', label: 'Full Gym' },
  { value: 'home', label: 'Home Setup' },
  { value: 'bodyweight', label: 'Bodyweight' },
]

const text = (v, fallback = '') => {
  if (v == null) return fallback
  const s = String(v).trim()
  return s || fallback
}

const exerciseItem = (item, index) => ({
  name: text(item?.name, `Exercise ${index + 1}`),
  sets: text(item?.sets, '3'),
  reps: text(item?.reps, '10-12'),
  notes: text(item?.notes, ''),
})

const targetExercisesPerDay = (duration = 60) => {
  const d = Number(duration) || 60
  if (d >= 90) return 6
  if (d >= 60) return 5
  if (d >= 45) return 4
  return 3
}

const buildExercisePool = (sourceExercises = [], targetCount = 0) => {
  const normalized = sourceExercises.map(exerciseItem)
  if (!normalized.length || targetCount <= 0) return normalized
  if (normalized.length >= targetCount) return normalized

  const expanded = [...normalized]
  let i = 0
  while (expanded.length < targetCount) {
    const base = normalized[i % normalized.length]
    expanded.push({
      ...base,
      notes: text(base.notes, 'Controlled form') + ' | Variation set',
    })
    i += 1
  }
  return expanded
}

const distributeExercises = (flatExercises = [], daysPerWeek = 4, goal = 'muscle_gain', duration = 60) => {
  const targetDays = Math.max(3, Math.min(6, Number(daysPerWeek) || 4))
  const splits = DAY_SPLITS[goal] || DAY_SPLITS.muscle_gain
  const perDay = targetExercisesPerDay(duration)
  const neededCount = targetDays * perDay

  if (!flatExercises.length) {
    return Array.from({ length: targetDays }, (_, i) =>
      ({
        day: `Day ${i + 1} - ${splits[i] || 'Training Day'}`,
        exercises: [
          { name: 'Bodyweight Squat', sets: '3', reps: '12-15', notes: 'Controlled tempo' },
          { name: 'Push-up', sets: '3', reps: '10-15', notes: 'Keep core tight' },
          { name: 'Plank', sets: '3', reps: '30-45 sec', notes: 'Neutral spine' },
        ],
      })
    )
  }

  const pool = buildExercisePool(flatExercises, neededCount)
  const days = []
  for (let i = 0; i < targetDays; i += 1) {
    const start = i * perDay
    const chunk = pool.slice(start, start + perDay)

    days.push({
      day: `Day ${i + 1} - ${splits[i] || 'Training Day'}`,
      exercises: chunk.length ? chunk.map(exerciseItem) : buildExercisePool(flatExercises, perDay).slice(0, perDay),
    })
  }

  return days
}

const normalizeAIPlan = (rawPlan, formData) => {
  if (!rawPlan) return null

  const parseRaw = () => {
    if (typeof rawPlan === 'string') {
      const trimmed = rawPlan.trim()
      const jsonMatch = trimmed.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
      return JSON.parse(jsonMatch ? jsonMatch[0] : trimmed)
    }
    return rawPlan
  }

  let parsed
  try {
    parsed = parseRaw()
  } catch {
    return null
  }

  // AI fallback utility may return a flat exercise array.
  if (Array.isArray(parsed)) {
    return {
      name: `${formData.daysPerWeek}-Day ${formData.goal === 'muscle_gain' ? 'Muscle' : 'Fat Loss'} Plan`,
      days: distributeExercises(parsed, formData.daysPerWeek, formData.goal, formData.duration),
    }
  }

  const sourceDays = Array.isArray(parsed.days) ? parsed.days : []
  const normalizedDays = sourceDays.map((day, dayIndex) => ({
    day: text(day?.day, `Day ${dayIndex + 1}`),
    exercises: Array.isArray(day?.exercises) ? day.exercises.map(exerciseItem) : [],
  }))

  const allExercises = normalizedDays.flatMap((d) => d.exercises || [])
  const exactDays = distributeExercises(allExercises, formData.daysPerWeek, formData.goal, formData.duration)

  return {
    name: text(parsed.name, `${formData.daysPerWeek}-Day Custom Plan`),
    days: exactDays,
  }
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

const tuneFallbackByExperience = (exercises, experience, goal) => {
  return exercises.map((exercise) => {
    const next = { ...exercise }
    const [setMin, setMax] = toSetRange(next.sets)

    if (experience === 'beginner') {
      const min = Math.max(2, setMin - 1)
      const max = Math.max(min, Math.min(3, setMax))
      next.sets = formatSetRange(min, max)
      next.notes = `${text(next.notes)}${next.notes ? ' | ' : ''}Beginner pace and strict form`
      if (goal === 'weight_loss' && !/sec|m/i.test(String(next.reps))) {
        next.reps = '10-15'
      }
    } else if (experience === 'advanced') {
      const min = Math.min(6, setMin + 1)
      const max = Math.min(6, setMax + 1)
      next.sets = formatSetRange(min, Math.max(min, max))
      next.notes = `${text(next.notes)}${next.notes ? ' | ' : ''}Advanced intensity block`
      if (goal === 'muscle_gain' && !/sec|m/i.test(String(next.reps))) {
        next.reps = '6-10'
      }
    }

    return next
  })
}

const getFallbackPlan = (formData) => {
  const equipment = formData.equipment || 'full_gym'
  const goal = formData.goal === 'muscle_gain' ? 'Muscle' : 'Fat Loss'

  const library = {
    full_gym: {
      muscle_gain: [
        { name: 'Barbell Squat', sets: '4', reps: '6-10', notes: 'Brace core before each rep' },
        { name: 'Bench Press', sets: '4', reps: '6-10', notes: 'Controlled eccentric' },
        { name: 'Lat Pulldown', sets: '3', reps: '10-12', notes: 'Pull elbows down' },
        { name: 'Romanian Deadlift', sets: '3', reps: '8-10', notes: 'Hip hinge, neutral spine' },
        { name: 'Cable Row', sets: '3', reps: '10-12', notes: 'Squeeze shoulder blades' },
        { name: 'Overhead Press', sets: '3', reps: '8-10', notes: 'Ribcage down' },
      ],
      weight_loss: [
        { name: 'Kettlebell Swing', sets: '4', reps: '15-20', notes: 'Explosive hip drive' },
        { name: 'Walking Lunge', sets: '3', reps: '12 each leg', notes: 'Keep chest tall' },
        { name: 'Incline Dumbbell Press', sets: '3', reps: '10-12', notes: 'No lockout rush' },
        { name: 'TRX Row', sets: '3', reps: '12-15', notes: 'Control tempo' },
        { name: 'Rower Sprint', sets: '5', reps: '30 sec', notes: 'High output intervals' },
        { name: 'Battle Rope Slams', sets: '4', reps: '25 sec', notes: 'Explosive rhythm' },
      ],
    },
    home: {
      muscle_gain: [
        { name: 'Goblet Squat', sets: '4', reps: '10-15', notes: 'Dumbbell at chest' },
        { name: 'Dumbbell Floor Press', sets: '4', reps: '8-12', notes: 'Pause at bottom' },
        { name: 'Single-arm Row', sets: '4', reps: '10-12', notes: 'Each side' },
        { name: 'Split Squat', sets: '3', reps: '10 each leg', notes: 'Rear foot elevated if possible' },
        { name: 'Shoulder Press', sets: '3', reps: '10-12', notes: 'Seated or standing' },
        { name: 'RDL with Dumbbells', sets: '3', reps: '10-12', notes: 'Hinge through hips' },
      ],
      weight_loss: [
        { name: 'Dumbbell Thruster', sets: '4', reps: '12-15', notes: 'Squat into press' },
        { name: 'Alternating Reverse Lunge', sets: '3', reps: '14 each leg', notes: 'Steady pace' },
        { name: 'Renegade Row', sets: '3', reps: '10-12', notes: 'Keep hips square' },
        { name: 'Mountain Climbers', sets: '4', reps: '30 sec', notes: 'Fast and controlled' },
        { name: 'Jump Rope', sets: '5', reps: '45 sec', notes: 'Short rest between rounds' },
        { name: 'Plank', sets: '3', reps: '45 sec', notes: 'Neutral spine' },
      ],
    },
    bodyweight: {
      muscle_gain: [
        { name: 'Tempo Air Squat', sets: '4', reps: '15-20', notes: '3-second eccentric' },
        { name: 'Push-up', sets: '4', reps: '10-20', notes: 'Hands under shoulders' },
        { name: 'Reverse Lunge', sets: '3', reps: '12 each leg', notes: 'Tall torso' },
        { name: 'Pike Push-up', sets: '3', reps: '8-12', notes: 'Focus shoulder drive' },
        { name: 'Glute Bridge', sets: '3', reps: '20', notes: 'Squeeze at top' },
        { name: 'Hollow Hold', sets: '3', reps: '20-30 sec', notes: 'Lower back pressed down' },
      ],
      weight_loss: [
        { name: 'Burpee', sets: '4', reps: '10-15', notes: 'Smooth pacing' },
        { name: 'Jump Squat', sets: '4', reps: '12-16', notes: 'Soft landing' },
        { name: 'High Knees', sets: '4', reps: '30 sec', notes: 'Drive knees up' },
        { name: 'Plank Jack', sets: '3', reps: '20', notes: 'Keep hips stable' },
        { name: 'Skater Hops', sets: '3', reps: '16 each side', notes: 'Explosive lateral push' },
        { name: 'Mountain Climbers', sets: '4', reps: '30 sec', notes: 'Steady breathing' },
      ],
    },
  }

  const goalKey = formData.goal === 'weight_loss' ? 'weight_loss' : 'muscle_gain'
  const base = library[equipment]?.[goalKey] || library.full_gym.muscle_gain
  const exercises = tuneFallbackByExperience(base, formData.experience, goalKey)

  if (goalKey === 'weight_loss') {
    exercises.push(
      equipment === 'full_gym'
        ? { name: 'Assault Bike Intervals', sets: '6', reps: '20 sec on / 40 sec off', notes: 'All-out effort on work phase' }
        : equipment === 'home'
          ? { name: 'Jump Rope Intervals', sets: '6', reps: '45 sec on / 15 sec off', notes: 'Maintain cadence' }
          : { name: 'EMOM Conditioning', sets: '10', reps: '20 sec burpees + 40 sec march', notes: 'Repeat each minute' }
    )
  }

  return {
    name: `${formData.daysPerWeek}-Day ${goal} Plan`,
    days: distributeExercises(exercises, formData.daysPerWeek, formData.goal, formData.duration),
  }
}

function WorkoutPlanGenerator() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState(DEFAULT_FORM)
  const [generatedPlan, setGeneratedPlan] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiError, setAiError] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return
      const parsed = JSON.parse(saved)
      if (parsed?.plan?.days?.length) {
        setGeneratedPlan(parsed.plan)
        if (parsed.formData) setFormData((prev) => ({ ...prev, ...parsed.formData }))
      }
    } catch {
      // Ignore invalid cache
    }
  }, [])

  const badgeData = useMemo(
    () => [
      { label: formData.goal === 'muscle_gain' ? 'Muscle Gain' : 'Weight Loss', icon: Target },
      { label: `${formData.daysPerWeek} Days/Week`, icon: Calendar },
      { label: `${formData.duration} Min Session`, icon: Timer },
      { label: formData.equipment === 'full_gym' ? 'Full Gym' : formData.equipment === 'home' ? 'Home Setup' : 'Bodyweight', icon: Dumbbell },
    ],
    [formData]
  )

  const persistPlan = (plan, nextFormData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ plan, formData: nextFormData }))
  }

  const generatePlan = async () => {
    setIsGenerating(true)
    setAiError(false)

    try {
      const goalText = formData.goal === 'muscle_gain' ? 'build muscle' : 'lose body fat'
      const equipmentText = {
        full_gym: 'full gym equipment with barbells, machines, and cables',
        home: 'home setup with dumbbells and minimal equipment',
        bodyweight: 'bodyweight only with no equipment',
      }[formData.equipment]

      const prompt = `Create a detailed ${formData.daysPerWeek}-day per week workout plan for a ${formData.experience} level person who wants to ${goalText}. 
Each session should be about ${formData.duration} minutes.
Available equipment: ${equipmentText}.

Return valid JSON only in this exact structure:
{
  "name": "Plan Name",
  "days": [
    {
      "day": "Day 1 - Focus",
      "exercises": [
        { "name": "Exercise", "sets": "3-4", "reps": "8-12", "notes": "Form cue" }
      ]
    }
  ]
}

Important: output exactly ${formData.daysPerWeek} day objects in the days array.`

      const raw = await generateWithAI(prompt, 'workout')
      const normalized = normalizeAIPlan(raw, formData)

      if (!normalized?.days?.length) {
        throw new Error('Invalid AI structure')
      }

      setGeneratedPlan(normalized)
      persistPlan(normalized, formData)
      toast.success('Workout plan generated.')
    } catch {
      setAiError(true)
      const fallback = getFallbackPlan(formData)
      setGeneratedPlan(fallback)
      persistPlan(fallback, formData)
      toast.error('AI unavailable. Loaded smart fallback plan.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen text-zinc-100 relative overflow-x-hidden" style={{ background: CALC_COLORS.page }}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 20% 10%, rgba(255,255,255,0.09), transparent 40%), radial-gradient(circle at 85% 85%, rgba(239,68,68,0.10), transparent 50%)',
        }}
      />

      <motion.header
        className="sticky top-0 z-50 px-4 md:px-8 h-20 flex items-center justify-between"
        style={{ background: 'rgba(6,8,11,0.82)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${MATTE.borderSoft}` }}
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center gap-3 md:gap-4">
          <motion.button
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${CALC_COLORS.accent}66` }}
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.96 }}
          >
            <ArrowLeft size={18} style={{ color: CALC_COLORS.accent }} />
          </motion.button>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.34em] text-zinc-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Engine Module</p>
            <h1 className="text-lg md:text-2xl font-black uppercase tracking-[0.1em]" style={{ color: CALC_COLORS.accent }}>Workout Plan</h1>
          </div>
        </div>

        {generatedPlan ? (
          <motion.button
            onClick={generatePlan}
            whileHover={{ scale: isGenerating ? 1 : 1.02 }}
            whileTap={{ scale: isGenerating ? 1 : 0.98 }}
            disabled={isGenerating}
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg disabled:opacity-60"
            style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${MATTE.borderSoft}` }}
          >
            <RefreshCw size={15} style={{ color: CALC_COLORS.signal }} className={isGenerating ? 'animate-spin' : ''} />
            <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: CALC_COLORS.accent, fontFamily: 'JetBrains Mono, monospace' }}>
              Regenerate
            </span>
          </motion.button>
        ) : null}
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 grid xl:grid-cols-12 gap-6 relative z-10">
        <motion.section
          className="xl:col-span-4 rounded-2xl p-5 md:p-6"
          style={{ background: MATTE.panel, border: `1px solid ${MATTE.borderSoft}` }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <p className="text-xs font-black uppercase tracking-[0.28em] text-zinc-300 mb-4" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            Plan Inputs
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormData((prev) => ({ ...prev, goal: 'muscle_gain' }))}
                className="rounded-xl p-3 text-left"
                style={{ background: formData.goal === 'muscle_gain' ? 'rgba(255,255,255,0.14)' : MATTE.inset, border: `1px solid ${MATTE.borderSoft}` }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Dumbbell size={14} style={{ color: CALC_COLORS.accent }} />
                  <p className="text-sm font-semibold text-zinc-100">Muscle</p>
                </div>
                <p className="text-xs text-zinc-500">Strength and size</p>
              </button>
              <button
                onClick={() => setFormData((prev) => ({ ...prev, goal: 'weight_loss' }))}
                className="rounded-xl p-3 text-left"
                style={{ background: formData.goal === 'weight_loss' ? 'rgba(255,255,255,0.14)' : MATTE.inset, border: `1px solid ${MATTE.borderSoft}` }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Flame size={14} style={{ color: CALC_COLORS.signal }} />
                  <p className="text-sm font-semibold text-zinc-100">Fat Loss</p>
                </div>
                <p className="text-xs text-zinc-500">Conditioning focus</p>
              </button>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 mb-2 block" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                Experience
              </label>
              <div className="grid grid-cols-3 gap-2">
                {EXPERIENCE.map((level) => (
                  <button
                    key={level}
                    onClick={() => setFormData((prev) => ({ ...prev, experience: level }))}
                    className="rounded-lg py-2 text-xs font-semibold capitalize"
                    style={{ background: formData.experience === level ? 'rgba(255,255,255,0.14)' : MATTE.inset, border: `1px solid ${MATTE.borderSoft}` }}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 mb-2 block" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                Equipment
              </label>
              <div className="grid grid-cols-3 gap-2">
                {EQUIPMENT.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setFormData((prev) => ({ ...prev, equipment: item.value }))}
                    className="rounded-lg py-2 text-[11px] font-semibold"
                    style={{ background: formData.equipment === item.value ? 'rgba(255,255,255,0.14)' : MATTE.inset, border: `1px solid ${MATTE.borderSoft}` }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  Days Per Week
                </label>
                <span className="text-sm font-bold text-zinc-200">{formData.daysPerWeek}</span>
              </div>
              <input
                type="range"
                min="3"
                max="6"
                value={formData.daysPerWeek}
                onChange={(e) => setFormData((prev) => ({ ...prev, daysPerWeek: Number(e.target.value) }))}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  Session Minutes
                </label>
                <span className="text-sm font-bold text-zinc-200">{formData.duration}</span>
              </div>
              <input
                type="range"
                min="30"
                max="120"
                step="15"
                value={formData.duration}
                onChange={(e) => setFormData((prev) => ({ ...prev, duration: Number(e.target.value) }))}
                className="w-full"
              />
            </div>

            <motion.button
              onClick={generatePlan}
              disabled={isGenerating}
              whileHover={{ scale: isGenerating ? 1 : 1.01 }}
              whileTap={{ scale: isGenerating ? 1 : 0.98 }}
              className="w-full py-3.5 rounded-xl text-black font-black uppercase tracking-[0.16em] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: `linear-gradient(120deg, ${CALC_COLORS.accent} 0%, #f3f4f6 100%)` }}
            >
              {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {isGenerating ? 'Generating...' : 'Generate Plan'}
            </motion.button>

            {aiError ? (
              <div className="rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5' }}>
                AI service fallback applied. You still got a complete plan.
              </div>
            ) : null}
          </div>
        </motion.section>

        <motion.section
          className="xl:col-span-8 rounded-2xl p-5 md:p-6"
          style={{ background: MATTE.panel, border: `1px solid ${MATTE.borderSoft}` }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {generatedPlan ? (
            <>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-zinc-500 mb-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    Generated Plan
                  </p>
                  <h2 className="text-2xl font-black text-zinc-100">{generatedPlan.name}</h2>
                </div>
                <button
                  onClick={() => exportWorkoutPlanToPDF(generatedPlan, formData)}
                  className="px-3 py-2 rounded-lg text-xs font-black uppercase tracking-[0.12em] flex items-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${MATTE.borderSoft}`, color: CALC_COLORS.accent }}
                >
                  <Download size={14} /> Export PDF
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                {badgeData.map((badge) => {
                  const Icon = badge.icon
                  return (
                    <span key={badge.label} className="px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5" style={{ background: MATTE.inset, border: `1px solid ${MATTE.borderSoft}`, color: '#cbd5e1' }}>
                      <Icon size={12} /> {badge.label}
                    </span>
                  )
                })}
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {generatedPlan.days.map((day, i) => (
                  <div key={`${day.day}-${i}`} className="rounded-xl p-4" style={{ background: MATTE.inset, border: `1px solid ${MATTE.borderSoft}` }}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-zinc-100 font-semibold">{day.day}</h3>
                      <span className="text-xs text-zinc-500">
                        {day.exercises.length > 0 ? `${day.exercises.length} exercises` : 'Recovery'}
                      </span>
                    </div>

                    {day.exercises.length > 0 ? (
                      <div className="space-y-2">
                        {day.exercises.map((exercise, exIndex) => (
                          <div key={`${exercise.name}-${exIndex}`} className="rounded-lg px-3 py-2" style={{ background: 'rgba(0,0,0,0.35)', border: `1px solid ${MATTE.borderSoft}` }}>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm text-zinc-100 font-medium">{exercise.name}</p>
                              <p className="text-xs text-zinc-400">{exercise.sets} x {exercise.reps}</p>
                            </div>
                            {exercise.notes ? <p className="text-xs text-zinc-500 mt-1">{exercise.notes}</p> : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500 italic">Rest day. Walk, stretch, recover.</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <button
                  onClick={() => navigate('/workout')}
                  className="py-3 rounded-xl text-sm font-bold uppercase tracking-[0.12em] flex items-center justify-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${MATTE.borderSoft}`, color: CALC_COLORS.accent }}
                >
                  <History size={15} /> Open Workout Tracker
                </button>
                <button
                  onClick={generatePlan}
                  disabled={isGenerating}
                  className="py-3 rounded-xl text-sm font-bold uppercase tracking-[0.12em] flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: 'rgba(239,68,68,0.16)', border: '1px solid rgba(239,68,68,0.35)', color: '#fecaca' }}
                >
                  <RefreshCw size={15} className={isGenerating ? 'animate-spin' : ''} /> Rebuild Plan
                </button>
              </div>
            </>
          ) : (
            <div className="h-full min-h-[420px] flex items-center justify-center text-center">
              <div className="max-w-lg">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${MATTE.borderSoft}` }}>
                  <Sparkles size={28} style={{ color: CALC_COLORS.signal }} />
                </div>
                <h2 className="text-2xl font-black text-zinc-100 mb-2">AI Workout Blueprint</h2>
                <p className="text-zinc-500 mb-4">Set your goal, level, days, and equipment. Then generate a complete schedule with exercise details.</p>
                <div className="inline-flex items-center gap-2 text-zinc-400 text-sm">
                  <CheckCircle size={15} /> Includes fallback plan if AI is offline
                </div>
              </div>
            </div>
          )}
        </motion.section>
      </main>

      <style>{`
        input[type='range'] {
          accent-color: #9ca3af;
        }
      `}</style>
    </div>
  )
}

export default WorkoutPlanGenerator
