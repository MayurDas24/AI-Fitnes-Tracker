import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Droplet, Plus, Minus, RotateCcw, Zap, Target, History } from 'lucide-react'
import { getTodayWater, getWaterIntake, saveWaterIntake } from '../services/api'

const GLASS_SIZE_ML = 250
const DAILY_GOAL = 8
const GOAL_ML = DAILY_GOAL * GLASS_SIZE_ML

const HYDRATION_TIPS = [
  { icon: '⚡', title: 'MORNING PROTOCOL', desc: 'Down 500ml immediately on waking — rehydrates cells and kickstarts metabolism' },
  { icon: '💪', title: 'PRE-WORKOUT', desc: 'Drink 500ml 2h before training. Dehydration cuts strength output by up to 10%' },
  { icon: '🔥', title: 'INTRA-WORKOUT', desc: 'Sip 150–250ml every 15 min during training to maintain performance' },
  { icon: '🌙', title: 'EVENING FLUSH', desc: 'Drink 250ml before bed to support overnight cellular repair and recovery' },
]

const asNumber = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const clampGlasses = (value) => {
  return Math.max(0, Math.min(DAILY_GOAL, Math.round(asNumber(value, 0))))
}

const getTodayKey = () => new Date().toISOString().split('T')[0]

const toDayKey = (rawDate) => {
  if (!rawDate) return null
  if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) return rawDate

  const parsed = new Date(rawDate)
  if (Number.isNaN(parsed.getTime())) return null

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).toISOString().split('T')[0]
}

const formatLogDate = (rawDate) => {
  const dayKey = toDayKey(rawDate)
  if (!dayKey) return 'Unknown date'
  const parsed = new Date(`${dayKey}T00:00:00`)
  return parsed.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function WaterTracker() {
  const navigate = useNavigate()
  const [waterIntake, setWaterIntake] = useState(0)
  const [historyLogs, setHistoryLogs] = useState([])
  const [usingBackend, setUsingBackend] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const persistLocalToday = useCallback((glasses) => {
    const safe = clampGlasses(glasses)
    localStorage.setItem('waterDate', getTodayKey())
    localStorage.setItem('waterIntake', String(safe))
  }, [])

  const loadLocalToday = useCallback(() => {
    const today = getTodayKey()
    const savedDate = toDayKey(localStorage.getItem('waterDate'))
    const savedGlasses = clampGlasses(localStorage.getItem('waterIntake'))

    if (savedDate === today) {
      setWaterIntake(savedGlasses)
    } else {
      setWaterIntake(0)
      persistLocalToday(0)
    }

    setHistoryLogs([])
  }, [persistLocalToday])

  useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      const rawToken = localStorage.getItem('token')
      const token = rawToken && rawToken !== 'null' && rawToken !== 'undefined' ? rawToken : null
      const canUseBackend = Boolean(token && token !== 'demo-token-skip-auth')

      if (!canUseBackend) {
        if (!cancelled) {
          setUsingBackend(false)
          loadLocalToday()
        }
        return
      }

      try {
        const [todayRecord, allRecords] = await Promise.all([getTodayWater(), getWaterIntake()])
        if (cancelled) return

        const backendGlasses = clampGlasses(asNumber(todayRecord?.amount, 0) / GLASS_SIZE_ML)
        setWaterIntake(backendGlasses)
        persistLocalToday(backendGlasses)
        setHistoryLogs(Array.isArray(allRecords) ? allRecords : [])
        setUsingBackend(true)
      } catch (error) {
        console.error('Failed to load water data:', error)
        if (!cancelled) {
          setUsingBackend(false)
          loadLocalToday()
        }
      }
    }

    void loadData()

    return () => {
      cancelled = true
    }
  }, [loadLocalToday, persistLocalToday])

  const syncBackend = useCallback(async (nextGlasses) => {
    if (!usingBackend) return

    setSyncing(true)
    try {
      await saveWaterIntake({
        date: getTodayKey(),
        amount: nextGlasses * GLASS_SIZE_ML,
        goal: GOAL_ML,
      })

      const allRecords = await getWaterIntake()
      setHistoryLogs(Array.isArray(allRecords) ? allRecords : [])
    } catch (error) {
      console.error('Failed to sync water intake:', error)
    } finally {
      setSyncing(false)
    }
  }, [usingBackend])

  const updateWaterIntake = useCallback((nextGlasses) => {
    const safe = clampGlasses(nextGlasses)
    setWaterIntake(safe)
    persistLocalToday(safe)
    void syncBackend(safe)
  }, [persistLocalToday, syncBackend])

  const addGlass = () => {
    if (waterIntake < DAILY_GOAL) updateWaterIntake(waterIntake + 1)
  }

  const removeGlass = () => {
    if (waterIntake > 0) updateWaterIntake(waterIntake - 1)
  }

  const reset = () => {
    updateWaterIntake(0)
  }

  const percentage = Math.min((waterIntake / DAILY_GOAL) * 100, 100)
  const totalMl = waterIntake * GLASS_SIZE_ML
  const goalMl = GOAL_ML
  const remaining = Math.max(goalMl - totalMl, 0)
  const isGoalMet = waterIntake >= DAILY_GOAL

  const previousLogs = useMemo(() => {
    if (!usingBackend) return []

    const today = getTodayKey()
    return (Array.isArray(historyLogs) ? historyLogs : [])
      .filter((entry) => {
        const dayKey = toDayKey(entry?.date || entry?.createdAt)
        return dayKey && dayKey !== today
      })
      .sort((a, b) => {
        const aKey = toDayKey(a?.date || a?.createdAt) || ''
        const bKey = toDayKey(b?.date || b?.createdAt) || ''
        return bKey.localeCompare(aKey)
      })
      .slice(0, 10)
  }, [historyLogs, usingBackend])

  const radius = 110
  const circ = 2 * Math.PI * radius
  const blueColor = '#00aaff'

  return (
    <div className="min-h-screen text-white overflow-x-hidden selection:bg-blue-500" style={{ background: '#020202', fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Grid */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      {/* Blue glow orb */}
      <div className="fixed pointer-events-none z-0" style={{ width: '600px', height: '600px', top: '0', left: '50%', transform: 'translateX(-50%)', background: `radial-gradient(circle, ${isGoalMet ? 'rgba(34,197,94,0.06)' : 'rgba(0,136,255,0.05)'}, transparent 70%)`, transition: 'background 1s ease' }} />

      {/* HEADER */}
      <motion.header className="sticky top-0 z-50 px-6 h-20 flex items-center justify-between relative" style={{ background: 'rgba(2,2,2,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,136,255,0.1)' }} initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,136,255,0.5), transparent)' }} />
        <div className="flex items-center gap-5 relative z-10">
          <motion.button onClick={() => navigate('/dashboard')} className="p-3 rounded-xl border transition-all" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <ArrowLeft size={18} className="text-zinc-500" />
          </motion.button>
          <div>
            <h1 className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              <Droplet style={{ color: blueColor, filter: 'drop-shadow(0 0 8px rgba(0,136,255,0.7))' }} size={22} /> HYDRATION_OS
            </h1>
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase mt-0.5" style={{ color: isGoalMet ? '#22c55e' : blueColor, fontFamily: 'JetBrains Mono, monospace' }}>
              {isGoalMet ? '✓ GOAL ACHIEVED' : `${waterIntake}/${DAILY_GOAL} GLASSES LOGGED`}
            </p>
            <p className="text-[9px] font-bold tracking-[0.16em] uppercase mt-1 text-zinc-600" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {usingBackend ? (syncing ? 'SYNCING TO BACKEND...' : 'BACKEND SYNC ACTIVE') : 'LOCAL MODE'}
            </p>
          </div>
        </div>
        <motion.button onClick={reset} className="p-3 rounded-xl border transition-all relative z-10" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <RotateCcw size={16} className="text-zinc-500" />
        </motion.button>
      </motion.header>

      <div className="max-w-2xl mx-auto px-6 py-10 relative z-10 space-y-6">

        {/* MAIN GAUGE */}
        <motion.div className="rounded-3xl p-8 flex flex-col items-center relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(0,136,255,0.08)' }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          {/* Corner accents */}
          {[['top-0 left-0', 'border-t-2 border-l-2'], ['top-0 right-0', 'border-t-2 border-r-2'], ['bottom-0 left-0', 'border-b-2 border-l-2'], ['bottom-0 right-0', 'border-b-2 border-r-2']].map(([pos, border], i) => (
            <div key={i} className={`absolute ${pos} w-6 h-6 pointer-events-none ${border}`} style={{ borderColor: 'rgba(0,136,255,0.2)' }} />
          ))}

          {/* SVG Gauge */}
          <div className="relative">
            <svg width="260" height="260" viewBox="0 0 260 260">
              <defs>
                <filter id="blueGlow">
                  <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <linearGradient id="waterGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor={isGoalMet ? '#22c55e' : '#0044cc'} />
                  <stop offset="100%" stopColor={isGoalMet ? '#86efac' : '#00ccff'} />
                </linearGradient>
              </defs>
              {/* Track */}
              <circle cx="130" cy="130" r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="12" />
              {/* Progress arc */}
              <motion.circle
                cx="130" cy="130" r={radius}
                fill="none"
                stroke="url(#waterGrad)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circ}
                animate={{ strokeDashoffset: circ * (1 - percentage / 100) }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                transform="rotate(-90 130 130)"
                filter="url(#blueGlow)"
              />
              {/* Drop marks */}
              {Array.from({ length: DAILY_GOAL }).map((_, i) => {
                const angle = (i / DAILY_GOAL) * 2 * Math.PI - Math.PI / 2
                const r2 = radius + 20
                return (
                  <circle key={i} cx={130 + r2 * Math.cos(angle)} cy={130 + r2 * Math.sin(angle)} r={i < waterIntake ? 5 : 3} fill={i < waterIntake ? blueColor : 'rgba(255,255,255,0.05)'} style={{ filter: i < waterIntake ? `drop-shadow(0 0 4px ${blueColor})` : 'none', transition: 'all 0.3s ease' }} />
                )
              })}
            </svg>

            {/* Center stats */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div key={waterIntake} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="text-center">
                  <p className="text-6xl font-black italic leading-none" style={{ fontFamily: 'JetBrains Mono, monospace', color: isGoalMet ? '#22c55e' : blueColor, filter: `drop-shadow(0 0 15px ${isGoalMet ? 'rgba(34,197,94,0.5)' : 'rgba(0,136,255,0.5)'})` }}>
                    {Math.round(percentage)}%
                  </p>
                  <p className="text-[9px] font-black tracking-[0.2em] uppercase mt-1 text-zinc-600" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{totalMl}ml / {goalMl}ml</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 w-full mt-6">
            {[
              { label: 'CONSUMED', value: waterIntake, unit: 'glasses', color: blueColor },
              { label: 'REMAINING', value: Math.max(0, DAILY_GOAL - waterIntake), unit: 'to go', color: '#ff6600' },
              { label: 'VOLUME', value: `${totalMl}`, unit: 'ml total', color: '#a855f7' },
            ].map(s => (
              <div key={s.label} className="text-center p-3 rounded-xl border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)' }}>
                <p className="text-[7px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{s.label}</p>
                <p className="text-xl font-black italic" style={{ color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</p>
                <p className="text-[8px] text-zinc-700 font-bold">{s.unit}</p>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex gap-4 w-full mt-6">
            <motion.button onClick={removeGlass} disabled={waterIntake === 0} className="flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 border transition-all disabled:opacity-30" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }} whileHover={{ scale: waterIntake > 0 ? 1.02 : 1 }} whileTap={{ scale: waterIntake > 0 ? 0.98 : 1 }}>
              <Minus size={16} className="text-zinc-500" /> REMOVE
            </motion.button>
            <motion.button onClick={addGlass} disabled={isGoalMet} className="flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-40" style={{ background: isGoalMet ? '#22c55e' : `linear-gradient(135deg, ${blueColor}, #0066cc)`, boxShadow: isGoalMet ? '0 0 25px rgba(34,197,94,0.3)' : `0 0 25px rgba(0,136,255,0.3)` }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              {isGoalMet ? <><Target size={16} /> DONE!</> : <><Plus size={16} /> ADD GLASS</>}
            </motion.button>
          </div>

          {/* Goal message */}
          <AnimatePresence>
            {isGoalMet && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="w-full mt-4 p-3 rounded-xl border text-center" style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.2)' }}>
                <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: '#22c55e', fontFamily: 'JetBrains Mono, monospace' }}>◉ DAILY HYDRATION TARGET ACHIEVED</p>
              </motion.div>
            )}
            {!isGoalMet && remaining > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full mt-4 p-3 rounded-xl border text-center" style={{ background: 'rgba(0,136,255,0.05)', borderColor: 'rgba(0,136,255,0.12)' }}>
                <p className="text-[10px] font-bold tracking-widest text-zinc-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{remaining}ml remaining to goal</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* GLASS GRID */}
        <motion.div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(0,136,255,0.06)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center gap-2 mb-4">
            <Droplet size={12} style={{ color: blueColor }} />
            <p className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>GLASS LOG</p>
          </div>
          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: DAILY_GOAL }).map((_, i) => (
              <motion.button key={i} onClick={i < waterIntake ? removeGlass : addGlass} className="aspect-square rounded-xl border flex flex-col items-center justify-center transition-all" style={{ background: i < waterIntake ? `${blueColor}20` : 'rgba(255,255,255,0.02)', borderColor: i < waterIntake ? `${blueColor}40` : 'rgba(255,255,255,0.05)', boxShadow: i < waterIntake ? `0 0 10px ${blueColor}30` : 'none' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Droplet size={18} style={{ color: i < waterIntake ? blueColor : '#27272a', filter: i < waterIntake ? `drop-shadow(0 0 4px ${blueColor})` : 'none' }} />
                <span className="text-[7px] font-black mt-0.5" style={{ color: i < waterIntake ? blueColor : '#3f3f46', fontFamily: 'JetBrains Mono, monospace' }}>{GLASS_SIZE_ML}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* PREVIOUS DAYS LOGS */}
        <motion.div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(0,136,255,0.06)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <History size={12} style={{ color: blueColor }} />
              <p className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>PREVIOUS LOGS</p>
            </div>
            <span className="text-[9px] uppercase tracking-[0.14em] text-zinc-600" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {usingBackend ? `${previousLogs.length} days` : 'backend required'}
            </span>
          </div>

          {usingBackend ? (
            previousLogs.length > 0 ? (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {previousLogs.map((entry, idx) => {
                  const amount = Math.max(0, asNumber(entry?.amount, 0))
                  const goal = Math.max(1, asNumber(entry?.goal, GOAL_ML))
                  const pct = Math.max(0, Math.min(100, Math.round((amount / goal) * 100)))

                  return (
                    <div key={`${entry?._id || entry?.date || idx}`} className="p-3 rounded-xl border" style={{ background: 'rgba(0,136,255,0.03)', borderColor: 'rgba(0,136,255,0.08)' }}>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-300" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {formatLogDate(entry?.date || entry?.createdAt)}
                        </p>
                        <p className="text-[10px] font-black text-zinc-100" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {amount}ml / {goal}ml
                        </p>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${blueColor}, #38bdf8)` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-[10px] text-zinc-500 font-bold tracking-[0.12em] uppercase" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                No previous backend logs yet. Keep logging daily to build history.
              </p>
            )
          ) : (
            <p className="text-[10px] text-zinc-500 font-bold tracking-[0.12em] uppercase" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Sign in with your account to store and view previous-day water logs from backend.
            </p>
          )}
        </motion.div>

        {/* HYDRATION TIPS */}
        <motion.div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(0,136,255,0.06)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center gap-2 mb-4">
            <Zap size={12} style={{ color: blueColor }} />
            <p className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>HYDRATION INTEL</p>
          </div>
          <div className="space-y-2">
            {HYDRATION_TIPS.map((tip, i) => (
              <motion.div key={i} className="flex items-start gap-3 p-3 rounded-xl border" style={{ background: 'rgba(0,136,255,0.03)', borderColor: 'rgba(0,136,255,0.08)' }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }}>
                <span className="text-xl">{tip.icon}</span>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: blueColor }}>{tip.title}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">{tip.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default WaterTracker
