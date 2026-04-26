import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Dumbbell, Apple, TrendingUp, User, LogOut,
  Target, Activity, BarChart3, Brain, Droplet,
  AlarmClock, ChevronRight, Sun, Moon
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { useApi } from '../hooks/useApi'
import { useTheme } from '../context/ThemeContext'


// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: Dumbbell,  label: 'Train',   path: '/workout'   },
  { icon: Apple,     label: 'Diet',    path: '/diet'      },
  { icon: TrendingUp,label: 'Stats',   path: '/progress'  },
  { icon: User,      label: 'Profile', path: '/profile'   },
]

const QUICK_LINKS = [
  { icon: BarChart3,  label: 'PLAN',     sub: 'Workout Plan',   path: '/workout-plan', color: '#f4f4f5' },
  { icon: Activity,   label: 'BODY',     sub: 'Body Analysis',  path: '/body-analysis', color: '#d4d4d8' },
  { icon: Target,     label: 'BMI',      sub: 'Calculator',     path: '/calculator',   color: '#a1a1aa' },
  { icon: Droplet,    label: 'WATER',    sub: 'Water Tracker',  path: '/water',        color: '#7dd3fc' },
  { icon: AlarmClock, label: 'TIMER',    sub: 'Rest Timer',     path: '/timer',        color: '#e4e4e7' },
  { icon: Dumbbell,   label: 'LIBRARY',  sub: 'Exercise DB',    path: '/exercises',    color: '#cbd5e1' },
  { icon: Brain,      label: 'AI',       sub: 'AI Trainer',     path: '/ai',           color: '#fafafa' },
]

const MOTIVATIONAL_QUOTES = [
  "The only bad workout is the one that didn't happen.",
  "Pain is temporary. Glory is forever.",
  "Your body can stand almost anything. It's your mind you have to convince.",
  "Champions aren't made in gyms. Champions are made from something they have deep inside them.",
  "If it doesn't challenge you, it doesn't change you.",
  "Sweat is just fat crying.",
  "Be stronger than your excuses.",
  "The hardest lift is lifting your ass off the couch.",
  "Success starts with self-discipline.",
  "Train insane or remain the same.",
]

const UI_THEME_KEY = 'uiColorTheme'
const UI_THEMES = {
  ice: {
    name: 'Graphite + Ice',
    page: 'linear-gradient(180deg, #0f1318 0%, #0d1116 18%, #0b0f14 44%, #090c11 72%, #07090d 100%)',
    glow: 'radial-gradient(circle, rgba(121,199,255,0.08), rgba(121,199,255,0.015) 42%, transparent 74%)',
    accent: '#79c7ff',
    accentSoft: 'rgba(121,199,255,0.18)'
  },
  copper: {
    name: 'Matte + Copper',
    page: 'linear-gradient(180deg, #11100f 0%, #100f0e 18%, #0e0d0c 44%, #0b0a09 72%, #080807 100%)',
    glow: 'radial-gradient(circle, rgba(201,122,61,0.08), rgba(201,122,61,0.015) 42%, transparent 74%)',
    accent: '#c97a3d',
    accentSoft: 'rgba(201,122,61,0.2)'
  },
  mint: {
    name: 'Obsidian + Mint',
    page: 'linear-gradient(180deg, #101413 0%, #0f1212 18%, #0d1010 44%, #0a0d0d 72%, #070909 100%)',
    glow: 'radial-gradient(circle, rgba(52,245,197,0.08), rgba(52,245,197,0.015) 42%, transparent 74%)',
    accent: '#34f5c5',
    accentSoft: 'rgba(52,245,197,0.2)'
  },
  crimson: {
    name: 'Crimson Steel',
    page: 'linear-gradient(180deg, #111013 0%, #0f0e11 18%, #0d0c0e 44%, #0a090b 72%, #070607 100%)',
    glow: 'radial-gradient(circle, rgba(212,74,87,0.08), rgba(212,74,87,0.015) 42%, transparent 74%)',
    accent: '#d44a57',
    accentSoft: 'rgba(212,74,87,0.2)'
  }
}

const THEME_ORDER = ['mint', 'ice', 'copper', 'crimson']

const MATTE_SURFACE = {
  page: 'linear-gradient(180deg, #10141a 0%, #0d1116 22%, #0b0f14 48%, #090c11 76%, #07090d 100%)',
  chrome: 'linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(64,74,86,0.08) 20%, rgba(14,18,24,0.96) 58%, rgba(9,12,17,1) 100%)',
  panel: 'linear-gradient(165deg, rgba(255,255,255,0.05) 0%, rgba(24,30,38,0.92) 28%, rgba(13,17,23,0.98) 62%, rgba(9,12,17,1) 100%)',
  inset: 'linear-gradient(170deg, rgba(255,255,255,0.03) 0%, rgba(20,26,34,0.95) 36%, rgba(11,15,21,1) 100%)',
  edge: 'rgba(255,255,255,0.09)',
  edgeSoft: 'rgba(255,255,255,0.045)',
  textSoft: '#b2bac7',
  textDim: '#6d7482',
}

const MATTE_SURFACE_LIGHT = {
  page: 'linear-gradient(180deg, #3b4451 0%, #353f4c 22%, #303948 48%, #2a3442 76%, #252f3d 100%)',
  chrome: 'linear-gradient(160deg, rgba(255,255,255,0.14) 0%, rgba(180,195,214,0.16) 20%, rgba(58,68,82,0.94) 58%, rgba(44,53,66,1) 100%)',
  panel: 'linear-gradient(165deg, rgba(255,255,255,0.14) 0%, rgba(78,90,108,0.90) 28%, rgba(56,67,82,0.96) 62%, rgba(42,51,64,1) 100%)',
  inset: 'linear-gradient(170deg, rgba(255,255,255,0.10) 0%, rgba(84,98,117,0.92) 36%, rgba(54,65,80,1) 100%)',
  edge: 'rgba(255,255,255,0.24)',
  edgeSoft: 'rgba(255,255,255,0.18)',
  textSoft: '#e2e8f0',
  textDim: '#cbd5e1',
}

function calcBMI(weight, height) {
  if (!weight || !height) return null
  const h = parseFloat(height) / 100
  const w = parseFloat(weight)
  if (isNaN(h) || isNaN(w) || h <= 0) return null
  const bmi = w / (h * h)
  if (bmi < 18.5) return { val: bmi.toFixed(1), label: 'Underweight', color: '#3b82f6' }
  if (bmi < 25)   return { val: bmi.toFixed(1), label: 'Normal',      color: '#22c55e' }
  if (bmi < 30)   return { val: bmi.toFixed(1), label: 'Overweight',  color: '#f59e0b' }
  return              { val: bmi.toFixed(1), label: 'Obese',       color: '#ff1a1a' }
}

function toDayKey(rawDate) {
  if (!rawDate) return null
  if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) return rawDate

  let parsed = new Date(rawDate)
  if (Number.isNaN(parsed.getTime()) && typeof rawDate === 'string' && /^[A-Za-z]{3}\s+\d{1,2}$/.test(rawDate.trim())) {
    parsed = new Date(`${rawDate} ${new Date().getFullYear()}`)
  }
  if (Number.isNaN(parsed.getTime())) return null
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).toISOString().split('T')[0]
}

function asNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function toFiniteOrNull(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function safePercent(value, goal) {
  const val = asNumber(value, 0)
  const target = asNumber(goal, 0)
  if (target <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((val / target) * 100)))
}

// ─── SECTION LABEL ────────────────────────────────────────────────────────────
const SectionLabel = ({ children, color = MATTE_SURFACE.textSoft }) => (
  <p className="text-[9px] font-black uppercase tracking-[0.35em] mb-3" style={{ fontFamily: 'JetBrains Mono, monospace', color }}>{children}</p>
)

// ─── RING PROGRESS ────────────────────────────────────────────────────────────
const RingProgress = ({ pct, size = 80, color, label, value }) => {
  const r = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dasharray 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-sm font-black" style={{ color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</p>
        </div>
      </div>
      <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{label}</p>
    </div>
  )
}

// ─── FORGE TOOLTIP ────────────────────────────────────────────────────────────
const ForgeTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(5,5,5,0.95)', border: '1px solid rgba(255,26,26,0.2)', fontFamily: 'JetBrains Mono, monospace' }}>
      <p className="text-zinc-500 mb-1 font-bold">{label}</p>
      {payload.map((item, i) => <p key={i} className="font-black" style={{ color: item.color || '#ff4444' }}>{item.value}{item.name === 'weight' ? 'kg' : item.name === 'calories' ? 'kcal' : ''}</p>)}
    </div>
  )
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
function Dashboard() {
  const navigate    = useNavigate()
  const location    = useLocation()
  const { isDark, toggleTheme } = useTheme()
  const [greeting, setGreeting] = useState('')
  const [time, setTime]       = useState(new Date())
  const [quoteIdx, setQuoteIdx] = useState(0)
  const [themeName, setThemeName] = useState(() => localStorage.getItem(UI_THEME_KEY) || 'mint')
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false)
  const theme = UI_THEMES[themeName] || UI_THEMES.ice
  const matte = isDark ? MATTE_SURFACE : MATTE_SURFACE_LIGHT
  const pageBackground = isDark
    ? theme.page
    : 'linear-gradient(180deg, #475466 0%, #404d5f 24%, #3a4658 52%, #333f51 78%, #2e394a 100%)'
  const cardStyle = {
    background: matte.panel,
    border: `1px solid ${matte.edgeSoft}`,
    boxShadow: isDark
      ? 'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -18px 28px rgba(0,0,0,0.55), 0 14px 24px rgba(0,0,0,0.48)'
      : 'inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -12px 24px rgba(16,24,40,0.28), 0 10px 20px rgba(18,24,33,0.22)',
  }

  useEffect(() => {
    localStorage.setItem(UI_THEME_KEY, themeName)
  }, [themeName])

  // Clock + greeting
  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'GOOD MORNING' : h < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING')
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const quoteTimer = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length)
    }, 7000)
    return () => clearInterval(quoteTimer)
  }, [])

  // ─── DATA ─────────────────────────────────────────────────────────────────
  const { data: userProfile } = useApi('/auth/me')
  const { data: workouts }    = useApi('/workouts')
  const { data: meals }       = useApi('/meals')
  const { data: progressLogs} = useApi('/progress')
  const { data: waterLogs }   = useApi('/water')

  const rawToken = localStorage.getItem('token')
  const authToken = rawToken && rawToken !== 'null' && rawToken !== 'undefined' ? rawToken : null
  const isDemoSession = authToken === 'demo-token-skip-auth'
  const shouldUseLocalFallback = !authToken || isDemoSession

  const user    = useMemo(() => {
    if (userProfile) return userProfile
    try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
  }, [userProfile])

  const profileAvatar = useMemo(() => {
    const localProfile = shouldUseLocalFallback
      ? (() => {
          try {
            return JSON.parse(localStorage.getItem('userProfile') || '{}')
          } catch {
            return {}
          }
        })()
      : {}

    const fromData =
      user?.profileData?.avatar ||
      user?.profileData?.photoUrl ||
      user?.profileData?.image ||
      user?.avatar ||
      user?.avatarUrl ||
      user?.photoUrl ||
      user?.picture ||
      localProfile?.avatar ||
      localProfile?.photoUrl ||
      localProfile?.image

    if (typeof fromData === 'string' && fromData.trim()) {
      return fromData.trim()
    }

    const nameSeed = encodeURIComponent(user?.name || 'User')
    return `https://ui-avatars.com/api/?name=${nameSeed}&background=111827&color=f3f4f6&size=128`
  }, [shouldUseLocalFallback, user])

  useEffect(() => {
    setAvatarLoadFailed(false)
  }, [profileAvatar])

  const localUserProfile = useMemo(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('userProfile') || '{}')
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }, [])
  const calorieData = useMemo(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('userCalorieData') || '{}')
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }, [])

  const profile = useMemo(() => {
    const server = user?.profileData || {}
    if (!shouldUseLocalFallback) return server

    return {
      ...server,
      weight: server.weight ?? localUserProfile.currentWeight ?? localUserProfile.weight,
      height: server.height ?? localUserProfile.height,
      goalWeight: server.goalWeight ?? localUserProfile.goalWeight,
      activityLevel: server.activityLevel ?? localUserProfile.activityLevel,
      fitnessGoal: server.fitnessGoal ?? localUserProfile.fitnessGoal,
    }
  }, [user, localUserProfile, shouldUseLocalFallback])
  const bmi     = useMemo(() => calcBMI(profile.weight, profile.height), [profile.weight, profile.height])
  const todayStr = new Date().toISOString().split('T')[0]
  const apiWorkouts = useMemo(() => (Array.isArray(workouts) ? workouts : []), [workouts])
  const apiMeals = useMemo(() => (Array.isArray(meals) ? meals : []), [meals])
  const apiWaterLogs = useMemo(() => (Array.isArray(waterLogs) ? waterLogs : []), [waterLogs])
  const localTodayLog = useMemo(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('todayLog') || '[]')
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }, [])
  const localWorkoutHistory = useMemo(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('workoutHistory') || '[]')
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }, [])

  const localTodayWaterMl = useMemo(() => {
    if (!shouldUseLocalFallback) return 0

    const storedDate = toDayKey(localStorage.getItem('waterDate'))
    if (storedDate !== todayStr) return 0

    const localGlasses = Math.max(0, asNumber(localStorage.getItem('waterIntake')))
    return localGlasses * 250
  }, [shouldUseLocalFallback, todayStr])

  const todayWaterRecord = useMemo(() => {
    return apiWaterLogs.find((entry) => toDayKey(entry?.date || entry?.createdAt) === todayStr) || null
  }, [apiWaterLogs, todayStr])

  const todayWaterMl = useMemo(() => {
    if (shouldUseLocalFallback) return localTodayWaterMl
    return Math.max(0, asNumber(todayWaterRecord?.amount))
  }, [shouldUseLocalFallback, localTodayWaterMl, todayWaterRecord])

  const waterGoalMl = useMemo(() => {
    if (shouldUseLocalFallback) return 2000
    return Math.max(1, asNumber(todayWaterRecord?.goal, 2000))
  }, [shouldUseLocalFallback, todayWaterRecord])
  const sourceWorkouts = useMemo(() => {
    const normalizedLocal = localWorkoutHistory.map((w) => ({
      ...w,
      createdAt: w.createdAt || (w.id ? new Date(w.id).toISOString() : undefined),
      volume: asNumber(w.volume),
      calories: asNumber(w.calories),
      completedSets: asNumber(w.completedSets),
      exercises: asNumber(w.exercises),
    }))

    const merged = shouldUseLocalFallback
      ? [...apiWorkouts, ...normalizedLocal]
      : [...apiWorkouts]

    const seen = new Set()
    return merged.filter((w) => {
      const k = `${w._id || w.id || ''}|${toDayKey(w.date || w.createdAt) || ''}|${asNumber(w.volume)}|${asNumber(w.calories)}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  }, [apiWorkouts, localWorkoutHistory, shouldUseLocalFallback])

  // Today's calories + macros
  const todayMeals = useMemo(() => {
    if (!shouldUseLocalFallback) {
      return apiMeals.filter(m => toDayKey(m?.date || m?.createdAt) === todayStr)
    }

    const apiToday = apiMeals.filter(m => toDayKey(m?.date || m?.createdAt) === todayStr)
    if (apiToday.length > 0) return apiToday
    return localTodayLog.map((m) => ({
      ...m,
      date: todayStr,
      calories: Number(m.calories) || 0,
      protein: Number(m.protein) || 0,
    }))
  }, [apiMeals, localTodayLog, todayStr, shouldUseLocalFallback])
  const todayCalories = useMemo(() => todayMeals.reduce((s, m) => s + (m.calories || 0), 0), [todayMeals])
  const todayProtein  = useMemo(() => todayMeals.reduce((s, m) => s + (m.protein || 0), 0), [todayMeals])
  const calorieGoal = parseInt(
    shouldUseLocalFallback
      ? (profile.calorieGoal || calorieData.goalCalories || calorieData.maintenanceCalories)
      : profile.calorieGoal
  ) || 2500
  const proteinGoal = parseInt(
    shouldUseLocalFallback
      ? (profile.proteinGoal || calorieData.protein)
      : profile.proteinGoal
  ) || Math.round((parseFloat(profile.weight) || 70) * 2.2)

  const workoutDaySet = useMemo(() => {
    const keys = sourceWorkouts
      .map((w) => toDayKey(w.date || w.createdAt))
      .filter(Boolean)
    return new Set(keys)
  }, [sourceWorkouts])

  // Workout streak (consecutive days from today)
  const streak = useMemo(() => {
    if (workoutDaySet.size === 0) return 0
    let s = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      if (workoutDaySet.has(ds)) {
        s += 1
      } else {
        // Streak breaks at first missing day.
        break
      }
    }
    return s
  }, [workoutDaySet])

  // Total volume all-time
  const totalVolume = useMemo(() => sourceWorkouts.reduce((s, w) => s + asNumber(w.volume), 0), [sourceWorkouts])

  // Last 7 days calorie chart
  const calorieHistory = useMemo(() => {
    const apiCalsByDay = apiMeals.reduce((acc, m) => {
      const key = toDayKey(m?.date || m?.createdAt)
      if (!key) return acc
      acc[key] = (acc[key] || 0) + (Number(m.calories) || 0)
      return acc
    }, {})
    const localTodayCalories = shouldUseLocalFallback
      ? localTodayLog.reduce((sum, m) => sum + (Number(m.calories) || 0), 0)
      : 0

    const result = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const hasApiToday = Boolean(apiCalsByDay[ds])
      const cal = hasApiToday
        ? apiCalsByDay[ds]
        : shouldUseLocalFallback && ds === todayStr
          ? localTodayCalories
          : 0
      result.push({ date: d.toLocaleDateString('en-US', { weekday: 'short' }), calories: cal })
    }
    return result
  }, [apiMeals, localTodayLog, todayStr, shouldUseLocalFallback])

  const calorieHistoryAvg = useMemo(() => {
    if (!calorieHistory.length) return 0
    const total = calorieHistory.reduce((sum, day) => sum + asNumber(day.calories), 0)
    return Math.round(total / calorieHistory.length)
  }, [calorieHistory])

  const peakCalorieDay = useMemo(() => {
    if (!calorieHistory.length) return null
    return calorieHistory.reduce((maxDay, d) => (asNumber(d.calories) > asNumber(maxDay.calories) ? d : maxDay), calorieHistory[0])
  }, [calorieHistory])

  const calorieChartDomain = useMemo(() => {
    if (!calorieHistory.length) return [0, 2400]
    const values = calorieHistory.map((d) => asNumber(d.calories, 0))
    const min = Math.max(0, Math.min(...values) - 120)
    const max = Math.max(400, Math.max(...values) + 120)
    return [min, max]
  }, [calorieHistory])

  const profileWeight = useMemo(() => toFiniteOrNull(profile.weight), [profile.weight])

  // Weight trend from progress logs + current profile weight
  const weightTrend = useMemo(() => {
    if (!progressLogs?.length) {
      if (!Number.isFinite(profileWeight)) return []
      return [{ date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), weight: profileWeight }]
    }
    const normalized = [...progressLogs]
      .filter(e => e.weight)
      .map((e) => {
        const dayKey = toDayKey(e.date || e.createdAt)
        if (!dayKey) return null
        const dateObj = new Date(`${dayKey}T00:00:00`)
        return {
          dayKey,
          date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          weight: toFiniteOrNull(e.weight),
        }
      })
      .filter((e) => e && Number.isFinite(e.weight))
      .sort((a,b) => new Date(`${a.dayKey}T00:00:00`) - new Date(`${b.dayKey}T00:00:00`))

    const byDay = new Map(normalized.map((p) => [p.dayKey, p]))
    if (Number.isFinite(profileWeight)) {
      const todayKey = new Date().toISOString().split('T')[0]
      byDay.set(todayKey, {
        dayKey: todayKey,
        date: new Date(`${todayKey}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: profileWeight,
      })
    }

    const mergedPoints = [...byDay.values()]
      .sort((a,b) => new Date(`${a.dayKey}T00:00:00`) - new Date(`${b.dayKey}T00:00:00`))
      .slice(-8)
      .map(({ date, weight }) => ({ date, weight }))

    if (mergedPoints.length > 0) return mergedPoints
    if (!Number.isFinite(profileWeight)) return []
    return [{ date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), weight: profileWeight }]
  }, [progressLogs, profileWeight])

  // Latest weight
  const latestWeight = useMemo(() => {
    if (Number.isFinite(profileWeight)) return profileWeight
    const normalized = (progressLogs || [])
      .map((e) => ({ dayKey: toDayKey(e.date || e.createdAt), weight: toFiniteOrNull(e.weight) }))
      .filter((e) => e.dayKey && Number.isFinite(e.weight))
      .sort((a, b) => new Date(`${b.dayKey}T00:00:00`) - new Date(`${a.dayKey}T00:00:00`))
    return normalized[0]?.weight ?? null
  }, [progressLogs, profileWeight])

  const dashboardWeightDomain = useMemo(() => {
    if (!weightTrend.length) return ['auto', 'auto']
    const values = weightTrend.map((p) => Number(p.weight)).filter((v) => Number.isFinite(v))
    if (!values.length) return ['auto', 'auto']

    const min = Math.min(...values)
    const max = Math.max(...values)
    const spread = Math.max(0.5, max - min)
    const pad = Math.max(0.2, spread * 0.35)
    return [Number((min - pad).toFixed(1)), Number((max + pad).toFixed(1))]
  }, [weightTrend])

  // Recent workouts (last 3)
  const recentWorkouts = useMemo(() => {
    return [...sourceWorkouts]
      .sort((a, b) => {
        const aKey = toDayKey(a.date || a.createdAt)
        const bKey = toDayKey(b.date || b.createdAt)
        const aTs = aKey ? new Date(`${aKey}T00:00:00`).getTime() : 0
        const bTs = bKey ? new Date(`${bKey}T00:00:00`).getTime() : 0
        if (aTs !== bTs) return bTs - aTs
        const aRaw = new Date(a.createdAt || 0).getTime() || 0
        const bRaw = new Date(b.createdAt || 0).getTime() || 0
        return bRaw - aRaw
      })
      .filter((w) => toDayKey(w.date || w.createdAt))
      .slice(0, 3)
  }, [sourceWorkouts])

  // Week summary
  const weekSummary = useMemo(() => {
    if (!sourceWorkouts.length) return { sessions: 0, volume: 0, calories: 0 }
    const weekDays = new Set(
      Array.from({ length: 7 }).map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - i)
        return d.toISOString().split('T')[0]
      })
    )
    const recent = sourceWorkouts.filter((w) => {
      const dayKey = toDayKey(w.date || w.createdAt)
      return dayKey && weekDays.has(dayKey)
    })
    return {
      sessions: recent.length,
      volume: recent.reduce((s,w) => s + asNumber(w.volume), 0),
      calories: recent.reduce((s,w) => s + asNumber(w.calories), 0),
    }
  }, [sourceWorkouts])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const cycleTheme = () => {
    const currentIdx = THEME_ORDER.indexOf(themeName)
    const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % THEME_ORDER.length
    setThemeName(THEME_ORDER[nextIdx])
  }

  const caloriePct = safePercent(todayCalories, calorieGoal)
  const proteinPct = safePercent(todayProtein, proteinGoal)
  const waterPct = safePercent(todayWaterMl, waterGoalMl)

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen w-screen text-white" style={{ background: pageBackground, fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="relative w-full min-h-screen overflow-hidden" style={{ background: matte.panel }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.014) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.014) 1px, transparent 1px)', backgroundSize: '56px 56px' }} />

        <div className="relative grid grid-cols-[76px_1fr] min-h-screen">
          <aside className="border-r flex flex-col" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(7,10,16,0.88)', backdropFilter: 'blur(8px)' }}>
            <div className="h-16 flex items-center justify-center border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <span className="text-[10px] uppercase tracking-[0.24em] text-zinc-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Menu</span>
            </div>
            <nav className="flex-1 py-4 px-2 flex flex-col justify-evenly gap-2">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="group w-full h-14 rounded-xl flex items-center justify-center relative"
                    style={{
                      background: isActive ? 'rgba(0,0,0,0.52)' : 'rgba(255,255,255,0.01)',
                      border: isActive ? '1px solid rgba(148,163,184,0.36)' : '1px solid rgba(255,255,255,0.04)'
                    }}
                    title={item.label}
                  >
                    <item.icon size={19} style={{ color: isActive ? '#ffffff' : '#81889a' }} />
                    {isActive && <span className="absolute -right-[9px] h-7 w-[3px] rounded-full" style={{ background: '#000000' }} />}
                    <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-100 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 z-20"
                      style={{ background: 'rgba(9,12,18,0.94)', border: '1px solid rgba(255,255,255,0.14)', boxShadow: '0 8px 18px rgba(0,0,0,0.4)' }}>
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </nav>
            <button onClick={handleLogout} className="h-14 border-t flex items-center justify-center" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <LogOut size={16} className="text-zinc-400" />
            </button>
          </aside>

          <section className="relative">
            <header className="h-16 px-6 lg:px-10 border-b flex items-center justify-between relative" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(7,10,16,0.82)', backdropFilter: 'blur(10px)' }}>
              <div className="leading-tight select-none">
                <p className="text-sm font-black tracking-[0.14em] text-zinc-100">DASHBOARD</p>
                <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">AI Fitness Tracker</p>
              </div>

              <div className="hidden md:block absolute left-1/2 -translate-x-1/2 text-center leading-tight pointer-events-none">
                <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-200 font-semibold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>{greeting}</p>
                <p className="text-xs text-zinc-300 mt-0.5" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>{time.toLocaleTimeString('en-US', { hour12: false })}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={cycleTheme}
                  className="h-9 px-3.5 rounded-full border text-[10px] font-bold uppercase tracking-[0.11em] flex items-center gap-1.5"
                  style={{
                    borderColor: 'rgba(255,255,255,0.2)',
                    background: 'linear-gradient(160deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03))',
                    color: '#f3f4f6',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)'
                  }}
                  title="Switch color theme"
                >
                  <span className="hidden lg:inline">Palette</span>
                  <span>{UI_THEMES[themeName]?.name?.split(' + ')[1] || 'Mint'}</span>
                </button>
                <button
                  onClick={toggleTheme}
                  className="h-9 px-3.5 rounded-full border text-[10px] font-bold uppercase tracking-[0.11em] flex items-center gap-1.5"
                  style={{
                    borderColor: 'rgba(255,255,255,0.2)',
                    background: 'linear-gradient(160deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03))',
                    color: '#f3f4f6',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)'
                  }}
                  title="Toggle dark and light"
                >
                  {isDark ? <Sun size={13} /> : <Moon size={13} />}
                  <span>{isDark ? 'Light' : 'Dark'}</span>
                </button>
                <button
                  onClick={() => navigate('/ai')}
                  className="h-9 px-4 rounded-full text-[10px] font-bold uppercase tracking-[0.12em] flex items-center gap-1.5"
                  style={{
                    background: 'linear-gradient(120deg, #2f2f2f 0%, #171717 60%, #000000 100%)',
                    color: '#fff',
                    border: '1px solid rgba(148,163,184,0.38)',
                    boxShadow: '0 10px 24px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.12)'
                  }}
                >
                  <Brain size={13} />
                  <span className="hidden sm:inline">AI Assistant</span>
                </button>
                <button onClick={() => navigate('/profile')} className="w-9 h-9 rounded-full border flex items-center justify-center" style={{ borderColor: matte.edgeSoft }}>
                  {!avatarLoadFailed ? (
                    <img
                      src={profileAvatar}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                      onError={() => setAvatarLoadFailed(true)}
                    />
                  ) : (
                    <span>{user?.name?.[0]?.toUpperCase() || 'A'}</span>
                  )}
                </button>
              </div>
            </header>

            <div className="h-[calc(100vh-64px)] overflow-y-auto">
              <div className="relative h-[calc(100vh-64px)] overflow-hidden">
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(135deg, #090909 0%, #0f141f 36%, #0b0d11 100%)'
                  }}
                />
                <div
                  className="absolute -inset-16"
                  style={{
                    backgroundImage: "url('https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=2200')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 52%',
                    transform: 'perspective(1500px) rotateX(8deg) rotateY(-8deg) scale(1.2)',
                    transformOrigin: 'center 42%',
                    filter: 'saturate(1.28) contrast(1.2) brightness(0.66)'
                  }}
                />
                <div
                  className="absolute -inset-12"
                  style={{
                    backgroundImage: "url('https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=2200')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 48%',
                    transform: 'perspective(1200px) rotateX(2deg) rotateY(4deg) scale(1.08)',
                    opacity: 0.3,
                    mixBlendMode: 'screen'
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(116deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.32) 30%, rgba(8,12,18,0.66) 58%, rgba(6,7,10,0.9) 100%)'
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(122deg, rgba(255,255,255,0.16) 0 2px, transparent 2px 17px)',
                    opacity: 0.3
                  }}
                />
                <div
                  className="absolute -left-24 top-10 w-72 h-72 rounded-[28px] border-[18px]"
                  style={{
                    borderColor: 'rgba(0,0,0,0.9)',
                    boxShadow: '0 0 68px rgba(0,0,0,0.42)',
                    transform: 'rotate(11deg)'
                  }}
                />
                <div
                  className="absolute -right-16 bottom-8 w-64 h-64 rounded-[24px] border-[14px]"
                  style={{
                    borderColor: 'rgba(0,209,255,0.84)',
                    boxShadow: '0 0 58px rgba(0,209,255,0.3)',
                    transform: 'rotate(-7deg)'
                  }}
                />
                <div
                  className="absolute inset-x-0 bottom-0 h-32"
                  style={{
                    background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.75) 88%)'
                  }}
                />
                <div className="absolute inset-0" style={{ background: theme.glow, opacity: 0.8 }} />

                <div className="relative z-10 h-full flex items-center justify-center px-6 lg:px-10 py-8">
                  <div className="w-full max-w-5xl">
                    <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-white/80 bg-black/45 mb-5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#000000]" />
                      <span className="text-[11px] tracking-[0.2em] font-black text-white uppercase" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Brutal Mode</span>
                    </div>

                    <div className="grid lg:grid-cols-[1.45fr,0.8fr] gap-7 items-end">
                      <div className="text-left">
                        <p className="text-4xl sm:text-5xl lg:text-7xl font-black leading-[0.95] text-white uppercase mb-4">Forge Your Strongest Self</p>
                        <p className="text-zinc-100 text-sm sm:text-base lg:text-lg max-w-2xl mb-4">Smash through training, meals, hydration, and progress with a dashboard designed like a control room.</p>
                        <p key={quoteIdx} className="text-zinc-100/95 italic text-sm sm:text-base mb-8 border-l-4 pl-4" style={{ borderColor: 'rgba(0,0,0,0.95)' }}>
                          "{MOTIVATIONAL_QUOTES[quoteIdx]}"
                        </p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <button
                            onClick={() => navigate('/workout-plan')}
                            className="px-8 py-3 text-xs font-black uppercase tracking-[0.14em] rounded-md"
                            style={{ background: 'linear-gradient(90deg, #232323 0%, #000000 100%)', color: '#ffffff', boxShadow: '0 12px 30px rgba(0,0,0,0.45)' }}
                          >
                            Select Your Plan
                          </button>
                        </div>
                      </div>

                      <div className="hidden lg:block">
                        <div className="border-2 border-white/75 bg-black/45 p-5 rounded-xl backdrop-blur-[1px]">
                          <p className="text-[10px] tracking-[0.24em] uppercase text-zinc-300 mb-4" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Today Snapshot</p>
                          <div className="space-y-4">
                            <div className="flex items-end justify-between border-b border-white/20 pb-2">
                              <span className="text-zinc-300 text-xs uppercase tracking-[0.14em]">Streak</span>
                              <span className="text-white text-2xl font-black">{streak}d</span>
                            </div>
                            <div className="flex items-end justify-between border-b border-white/20 pb-2">
                              <span className="text-zinc-300 text-xs uppercase tracking-[0.14em]">Calories</span>
                              <span className="text-white text-2xl font-black">{todayCalories}</span>
                            </div>
                            <div className="flex items-end justify-between">
                              <span className="text-zinc-300 text-xs uppercase tracking-[0.14em]">Protein</span>
                              <span className="text-white text-2xl font-black">{todayProtein}g</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 border-t" style={{ borderColor: matte.edgeSoft }}>
                <div className="p-5 border-b lg:border-b-0 lg:border-r" style={{ borderColor: matte.edgeSoft }}>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-3">Week Recap</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="rounded-lg p-3 border" style={{ borderColor: matte.edgeSoft }}>
                      <p className="text-xs text-zinc-500 uppercase">Sessions</p>
                      <p className="text-xl font-black" style={{ color: theme.accent }}>{weekSummary.sessions}</p>
                    </div>
                    <div className="rounded-lg p-3 border" style={{ borderColor: matte.edgeSoft }}>
                      <p className="text-xs text-zinc-500 uppercase">Volume</p>
                      <p className="text-xl font-black text-zinc-200">{weekSummary.volume}kg</p>
                    </div>
                  </div>
                  <div className="rounded-lg p-3 border" style={{ borderColor: matte.edgeSoft }}>
                    <p className="text-xs text-zinc-500 uppercase mb-1">Burned / Total</p>
                    <p className="text-sm font-bold text-zinc-200">{weekSummary.calories} kcal this week</p>
                    <p className="text-xs text-zinc-500">{totalVolume}kg lifetime volume</p>
                  </div>
                </div>

                <div className="p-5 border-b lg:border-b-0 lg:border-r" style={{ borderColor: matte.edgeSoft }}>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-3">Snapshot</p>
                  <div className="grid grid-cols-3 gap-3 text-center mb-4">
                    <div>
                      <p className="text-lg font-black" style={{ color: theme.accent }}>{streak}d</p>
                      <p className="text-[10px] text-zinc-500 uppercase">Streak</p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-zinc-200">{todayCalories}</p>
                      <p className="text-[10px] text-zinc-500 uppercase">Calories</p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-zinc-200">{latestWeight ? `${latestWeight}kg` : '--'}</p>
                      <p className="text-[10px] text-zinc-500 uppercase">Weight</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-lg p-2 border text-center" style={{ borderColor: matte.edgeSoft }}>
                      <p className="text-sm font-black text-zinc-200">{todayProtein}g</p>
                      <p className="text-[10px] text-zinc-500 uppercase">Protein</p>
                    </div>
                    <div className="rounded-lg p-2 border text-center" style={{ borderColor: matte.edgeSoft }}>
                      <p className="text-sm font-black text-zinc-200">{bmi?.val || '--'}</p>
                      <p className="text-[10px] text-zinc-500 uppercase">BMI</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-[10px] text-zinc-500 mb-1"><span>Calorie Goal</span><span>{caloriePct}%</span></div>
                      <div className="h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${caloriePct}%`, background: '#22c55e' }} /></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-zinc-500 mb-1"><span>Protein Goal</span><span>{proteinPct}%</span></div>
                      <div className="h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${proteinPct}%`, background: '#f59e0b' }} /></div>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-3">Quick Access</p>
                  <div className="space-y-2 mb-3">
                    {QUICK_LINKS.slice(0, 6).map((link) => (
                      <button key={link.path} onClick={() => navigate(link.path)} className="w-full flex items-center justify-between p-2 rounded-md hover:bg-white/5">
                        <span className="text-xs text-zinc-300">{link.sub}</span>
                        <ChevronRight size={14} className="text-zinc-500" />
                      </button>
                    ))}
                  </div>
                  <button onClick={() => navigate('/progress')} className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: theme.accent }}>
                    View Full Progress
                  </button>
                </div>
              </div>

              <div className="grid xl:grid-cols-3 gap-4 p-4 lg:p-6 border-t" style={{ borderColor: matte.edgeSoft }}>
                <div className="xl:col-span-2 rounded-xl p-4" style={cardStyle}>
                  <div className="flex items-center justify-between mb-3">
                    <SectionLabel color={matte.textSoft}>Weight Trend</SectionLabel>
                    <button onClick={() => navigate('/progress')} className="text-[10px] uppercase tracking-[0.15em]" style={{ color: theme.accent }}>
                      {latestWeight ? `${latestWeight}kg Current` : 'Open Progress'}
                    </button>
                  </div>
                  {weightTrend.length > 0 ? (
                    <div className="h-44 min-w-0">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <AreaChart data={weightTrend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="weightAreaLite" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={theme.accent} stopOpacity={0.35} />
                              <stop offset="95%" stopColor={theme.accent} stopOpacity={0.03} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} domain={dashboardWeightDomain} />
                          <Tooltip content={<ForgeTip />} />
                          <Area type="linear" dataKey="weight" stroke={theme.accent} fill="url(#weightAreaLite)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-44 flex items-center justify-center text-zinc-500 text-sm">No weight logs yet</div>
                  )}
                </div>

                <div className="rounded-xl p-4 flex flex-col" style={cardStyle}>
                  <div className="mb-2">
                    <SectionLabel color={matte.textSoft}>Live Rings</SectionLabel>
                  </div>
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 place-items-center">
                    <RingProgress pct={caloriePct} size={74} color="#22c55e" label="CAL" value={`${caloriePct}%`} />
                    <RingProgress pct={proteinPct} size={74} color="#f59e0b" label="PRO" value={`${proteinPct}%`} />
                    <RingProgress pct={waterPct} size={74} color="#38bdf8" label="WATER" value={`${waterPct}%`} />
                    <RingProgress pct={Math.min(100, streak * 10)} size={74} color={theme.accent} label="STREAK" value={`${streak}D`} />
                  </div>
                </div>

                <div className="xl:col-span-2 rounded-xl p-4" style={cardStyle}>
                  <div className="flex items-center justify-between mb-2">
                    <SectionLabel color={matte.textSoft}>Calorie History</SectionLabel>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>7-day avg</p>
                      <p className="text-sm font-black" style={{ color: '#86efac', fontFamily: 'JetBrains Mono, monospace' }}>{calorieHistoryAvg} kcal</p>
                    </div>
                  </div>
                  <div className="h-44 min-w-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <AreaChart data={calorieHistory} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="calAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.42} />
                            <stop offset="95%" stopColor="#34d399" stopOpacity={0.03} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} domain={calorieChartDomain} />
                        <Tooltip content={<ForgeTip />} />
                        <ReferenceLine y={calorieHistoryAvg} stroke="#86efac" strokeDasharray="4 4" ifOverflow="extendDomain" />
                        <ReferenceLine y={calorieGoal} stroke="rgba(255,255,255,0.45)" strokeDasharray="3 6" ifOverflow="extendDomain" />
                        <Area type="monotone" dataKey="calories" stroke="#34d399" fill="url(#calAreaGrad)" strokeWidth={2.5} dot={{ r: 3, fill: '#34d399', stroke: '#052e24', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#6ee7b7', stroke: '#052e24', strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.14em]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    <span className="text-zinc-500">target {calorieGoal} kcal</span>
                    <span className="text-zinc-400">peak {peakCalorieDay?.date || '--'} {asNumber(peakCalorieDay?.calories)} kcal</span>
                  </div>
                </div>

                <div className="rounded-xl p-4" style={cardStyle}>
                  <SectionLabel color={matte.textSoft}>Recent Workouts</SectionLabel>
                  {recentWorkouts.length === 0 ? (
                    <div className="h-28 flex items-center justify-center text-zinc-500 text-sm">No workouts yet. Start one now.</div>
                  ) : (
                    <div className="space-y-2">
                      {recentWorkouts.map((w, i) => (
                        <button
                          key={w._id || w.id || i}
                          onClick={() => navigate('/workout')}
                          className="w-full text-left rounded-lg px-3 py-2 border hover:bg-white/5"
                          style={{ borderColor: matte.edgeSoft }}
                        >
                          <p className="text-xs font-bold text-zinc-200">{w.createdAt || w.date ? new Date(w.createdAt || w.date).toLocaleDateString() : 'Unknown date'}</p>
                          <p className="text-[11px] text-zinc-500">{asNumber(w.volume)}kg • {asNumber(w.calories)} kcal</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
