import { useState, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, TrendingUp, Target, Flame,
  Plus, Trash2, ChevronDown, ChevronUp, BarChart3,
  Activity, Zap, Save, X, Loader2, Camera,
  Image as ImageIcon, Upload, ZoomIn, Tag
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useApi, apiPost, apiDelete } from '../hooks/useApi'
import toast from 'react-hot-toast'

const STATS_THEME = {
  page: 'linear-gradient(120deg, #030b0a 0%, #081714 34%, #0d1f1a 68%, #030b0a 100%)',
  accent: '#2dd4bf',
  hot: '#fb7185',
  border: 'rgba(45,212,191,0.20)',
  borderSoft: 'rgba(255,255,255,0.08)',
  panel: 'linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(15,23,23,0.92) 40%, rgba(5,10,10,0.98) 100%)',
}

// ─── FORGE TOOLTIP ────────────────────────────────────────────────────────────
const ForgeTooltip = ({ active, payload, label, unit = '' }) => {
  if (!active || !payload?.length) return null
  const displayLabel = payload?.[0]?.payload?.range || label
  return (
    <div className="rounded-xl px-4 py-3 text-xs" style={{ background: 'rgba(5,8,8,0.96)', border: `1px solid ${STATS_THEME.border}`, fontFamily: 'JetBrains Mono, monospace' }}>
      <p className="text-zinc-500 font-bold uppercase tracking-widest mb-2">{displayLabel}</p>
      {payload.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
          <span className="text-zinc-400">{item.name}:</span>
          <span className="font-black" style={{ color: item.color }}>{item.value}{unit || (item.unit || '')}</span>
        </div>
      ))}
    </div>
  )
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
const EmptyState = ({ message, sub }) => (
  <div className="flex flex-col items-center justify-center h-48 gap-3">
    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(45,212,191,0.10)', border: `1px solid ${STATS_THEME.border}` }}>
      <BarChart3 size={22} style={{ color: STATS_THEME.accent }} />
    </div>
    <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{message}</p>
    {sub && <p className="text-zinc-700 text-xs">{sub}</p>}
  </div>
)

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
const SectionCard = ({ title, children, action, accentColor = '#ff1a1a' }) => (
  <motion.div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: STATS_THEME.panel, border: `1px solid ${STATS_THEME.borderSoft}` }}
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
    {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
      <div key={i} className={`absolute ${pos} w-4 h-4 pointer-events-none`} style={{
        borderColor: `${accentColor}25`, borderStyle: 'solid',
        borderWidth: `${i < 2 ? '1px' : '0'} ${i % 2 === 1 ? '1px' : '0'} ${i >= 2 ? '1px' : '0'} ${i % 2 === 0 ? '1px' : '0'}`
      }} />
    ))}
    <div className="flex items-center justify-between mb-5">
      <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{title}</p>
      {action}
    </div>
    {children}
  </motion.div>
)

// ─── STAT CARD ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: Icon, color, delay = 0 }) => (
  <motion.div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: STATS_THEME.panel, border: `1px solid ${STATS_THEME.borderSoft}` }}
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
    <div className="flex items-start justify-between mb-4">
      <div className="p-2.5 rounded-xl" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-700" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{sub}</p>
    </div>
    <p className="text-3xl font-black italic" style={{ color, fontFamily: 'JetBrains Mono, monospace', filter: `drop-shadow(0 0 12px ${color}50)` }}>{value}</p>
    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mt-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{label}</p>
  </motion.div>
)

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
// ─── IMAGE COMPRESSION ────────────────────────────────────────────────────────
const compressImage = (file, maxW = 900, quality = 0.72) =>
  new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxW) { height = Math.round((height * maxW) / width); width = maxW }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })

const PHOTO_LABELS = ['Front', 'Back', 'Left Side', 'Right Side', 'Full Body', 'Progress']

function ProgressPage() {
  const navigate = useNavigate()
  const [showLogModal, setShowLogModal] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [expandedEntry, setExpandedEntry] = useState(null)
  const [activeTab, setActiveTab] = useState('overview') // 'overview'|'history'|'body'|'photos'

  // Photo state
  const [photoLabel, setPhotoLabel] = useState('Front')
  const [photoDate, setPhotoDate] = useState(new Date().toISOString().split('T')[0])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [lightbox, setLightbox] = useState(null) // { src, date, label }
  const [dragOver, setDragOver] = useState(false)
  const photoInputRef = useRef(null)

  // Form state for new progress log
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    bodyFat: '',
    notes: '',
    chest: '', waist: '', hips: '', arms: '', legs: ''
  })
  const [saving, setSaving] = useState(false)

  // ─── DATA FETCHING ─────────────────────────────────────────────────────────
  const { data: progressEntries, loading: progressLoading, refetch: refetchProgress } = useApi('/progress')
  const { data: workouts, loading: workoutsLoading } = useApi('/workouts')
  const { data: meals, loading: mealsLoading } = useApi('/meals')
  const { data: userProfile, loading: profileLoading } = useApi('/auth/me')

  const isLoading = progressLoading || workoutsLoading || mealsLoading || profileLoading

  // ─── DERIVED DATA ──────────────────────────────────────────────────────────
  const profile = useMemo(() => userProfile?.profileData || {}, [userProfile])
  const currentWeight = useMemo(() => parseFloat(profile.weight) || null, [profile])
  const goalWeight = useMemo(() => parseFloat(profile.goalWeight) || null, [profile])

  // Weight chart from progress entries (sorted chronologically)
  const weightChartData = useMemo(() => {
    if (!progressEntries?.length) return []
    return [...progressEntries]
      .filter(e => e.weight)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-12)
      .map(e => ({
        date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: parseFloat(e.weight),
        bodyFat: e.bodyFat ? parseFloat(e.bodyFat) : null,
        goal: goalWeight || currentWeight
      }))
  }, [progressEntries, goalWeight, currentWeight])

  const weightYAxisDomain = useMemo(() => {
    if (!weightChartData.length) return ['auto', 'auto']
    const values = weightChartData.map((d) => Number(d.weight)).filter((v) => Number.isFinite(v))
    if (!values.length) return ['auto', 'auto']

    const min = Math.min(...values)
    const max = Math.max(...values)
    const spread = Math.max(0.6, max - min)
    const pad = Math.max(0.25, spread * 0.35)

    return [Number((min - pad).toFixed(1)), Number((max + pad).toFixed(1))]
  }, [weightChartData])

  // Workout frequency per week (last 8 weeks)
  const workoutFreqData = useMemo(() => {
    if (!workouts?.length) return []

    const getWeekStart = (rawDate) => {
      const d = new Date(rawDate)
      if (Number.isNaN(d.getTime())) return null
      const copy = new Date(d)
      const day = copy.getDay()
      const diff = copy.getDate() - day + (day === 0 ? -6 : 1)
      copy.setDate(diff)
      copy.setHours(0, 0, 0, 0)
      return copy
    }

    const toKey = (dateObj) => dateObj.toISOString().split('T')[0]

    const weekMap = new Map()
    workouts.forEach((w) => {
      const ws = getWeekStart(w.date || w.createdAt)
      if (!ws) return
      const key = toKey(ws)
      const prev = weekMap.get(key) || { workouts: 0, volume: 0 }
      weekMap.set(key, {
        workouts: prev.workouts + 1,
        volume: prev.volume + (Number(w.volume) || 0),
      })
    })

    const today = new Date()
    const currentWeekStart = getWeekStart(today)
    const rows = []

    for (let i = 7; i >= 0; i--) {
      const ws = new Date(currentWeekStart)
      ws.setDate(currentWeekStart.getDate() - i * 7)
      const key = toKey(ws)
      const weekEnd = new Date(ws)
      weekEnd.setDate(ws.getDate() + 6)
      const found = weekMap.get(key) || { workouts: 0, volume: 0 }

      rows.push({
        week: `W${8 - i}`,
        range: `${ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        workouts: found.workouts,
        volume: Math.round(found.volume),
      })
    }

    return rows
  }, [workouts])

  // Calorie data last 7 days
  const calorieData = useMemo(() => {
    const getNum = (v) => Number(v) || 0
    const mealDateKey = (m) => {
      if (m?.date) return String(m.date).split('T')[0]
      if (m?.createdAt) return new Date(m.createdAt).toISOString().split('T')[0]
      return null
    }

    const result = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayMeals = meals?.filter(m => mealDateKey(m) === dateStr) || []
      result.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        calories: dayMeals.reduce((s, m) => s + getNum(m.calories), 0),
        protein: dayMeals.reduce((s, m) => s + getNum(m.protein), 0),
      })
    }
    return result
  }, [meals])

  // Key stats
  const totalWorkouts = workouts?.length || 0

  const streak = useMemo(() => {
    if (!workouts?.length) return 0
    let s = 0
    const today = new Date()
    for (let i = 0; i < 60; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      if (workouts.some(w => (w.date || w.createdAt?.split('T')[0]) === ds)) s++
      else if (i > 0) break
    }
    return s
  }, [workouts])

  const totalVolume = useMemo(() =>
    workouts?.reduce((s, w) => s + (w.volume || 0), 0) || 0
  , [workouts])

  const avgCaloriesPerDay = useMemo(() => {
    if (!meals?.length) return 0
    const byDate = {}
    meals.forEach(m => { byDate[m.date] = (byDate[m.date] || 0) + (m.calories || 0) })
    const vals = Object.values(byDate)
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
  }, [meals])

  const latestWeight = useMemo(() => {
    const entry = progressEntries?.find(e => e.weight)
    if (entry) return parseFloat(entry.weight)
    return currentWeight
  }, [progressEntries, currentWeight])

  const consistencyScore = useMemo(() => {
    if (!workoutFreqData.length) return 0
    const recent = workoutFreqData.slice(-4)
    const avgPerWeek = recent.reduce((sum, row) => sum + (row.workouts || 0), 0) / recent.length
    return Math.min(100, Math.round((avgPerWeek / 5) * 100))
  }, [workoutFreqData])

  const goalDelta = useMemo(() => {
    if (latestWeight == null || goalWeight == null) return null
    return Number((latestWeight - goalWeight).toFixed(1))
  }, [latestWeight, goalWeight])

  // ─── All photos from all entries (flat list) ─────────────────────────────────
  const allPhotos = useMemo(() => {
    if (!progressEntries?.length) return []
    const photos = []
    ;[...progressEntries]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .forEach(entry => {
        (entry.photos || []).forEach(photoStr => {
          // Format: "label||base64" or just base64
          const [label, src] = photoStr.includes('||') ? photoStr.split('||') : ['Photo', photoStr]
          photos.push({ src, label, date: entry.date, entryId: entry._id })
        })
      })
    return photos
  }, [progressEntries])

  // ─── UPLOAD PHOTO ──────────────────────────────────────────────────────────
  const handlePhotoUpload = useCallback(async (files) => {
    if (!files?.length) return
    setUploadingPhoto(true)
    try {
      const compressed = await compressImage(files[0])
      const photoStr = `${photoLabel}||${compressed}`
      const res = await apiPost('/progress', {
        date: photoDate,
        photos: [photoStr]
      })
      if (res) {
        toast.success('Photo saved!', { style: { background: '#0a0a0a', color: '#fff', border: '1px solid rgba(34,197,94,0.3)' } })
        refetchProgress()
      } else {
        toast.error('Could not save photo. Make sure you are logged in.')
      }
    } catch (e) {
      toast.error('Upload failed: ' + (e.message || 'Unknown error'))
    } finally {
      setUploadingPhoto(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }, [photoLabel, photoDate, refetchProgress])

  // ─── SAVE PROGRESS ─────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!form.date) return toast.error('Date is required')
    if (!form.weight && !form.bodyFat && !form.chest && !form.waist && !form.notes) {
      return toast.error('Enter at least one measurement')
    }
    setSaving(true)
    try {
      const payload = {
        date: form.date,
        ...(form.weight && { weight: parseFloat(form.weight) }),
        ...(form.bodyFat && { bodyFat: parseFloat(form.bodyFat) }),
        ...(form.notes && { notes: form.notes }),
        measurements: {
          ...(form.chest && { chest: parseFloat(form.chest) }),
          ...(form.waist && { waist: parseFloat(form.waist) }),
          ...(form.hips && { hips: parseFloat(form.hips) }),
          ...(form.arms && { arms: parseFloat(form.arms) }),
          ...(form.legs && { legs: parseFloat(form.legs) }),
        }
      }
      const res = await apiPost('/progress', payload)
      if (res) {
        toast.success('Progress logged!', { style: { background: '#0a0a0a', color: '#fff', border: '1px solid rgba(34,197,94,0.3)' } })
        setShowLogModal(false)
        setForm({ date: new Date().toISOString().split('T')[0], weight: '', bodyFat: '', notes: '', chest: '', waist: '', hips: '', arms: '', legs: '' })
        refetchProgress()
      } else {
        toast.error('Failed to save. Please login properly.')
      }
    } catch (e) {
      toast.error(e.message || 'Failed to save progress')
    } finally {
      setSaving(false)
    }
  }, [form, refetchProgress])

  // ─── DELETE PROGRESS ───────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id) => {
    setDeletingId(id)
    try {
      await apiDelete(`/progress/${id}`)
      toast.success('Entry deleted')
      refetchProgress()
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }, [refetchProgress])

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '10px',
    color: '#e4e4e7',
    padding: '10px 14px',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
    fontFamily: "'Space Grotesk', sans-serif",
    transition: 'border-color 0.2s'
  }

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen text-white overflow-x-hidden selection:bg-emerald-300/40" style={{ background: STATS_THEME.page, fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Grid */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      {/* Glow orb */}
      <div className="fixed pointer-events-none z-0" style={{ width: '600px', height: '600px', top: '-100px', left: '30%', background: 'radial-gradient(circle, rgba(45,212,191,0.08), transparent 70%)' }} />

      {/* HEADER */}
      <motion.header className="sticky top-0 z-50 px-6 h-20 flex items-center justify-between relative" style={{ background: 'rgba(4,9,9,0.9)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${STATS_THEME.border}` }} initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(45,212,191,0.55), transparent)' }} />
        <div className="flex items-center gap-5 relative z-10">
          <motion.button onClick={() => navigate('/dashboard')} className="p-3 rounded-xl border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <ArrowLeft size={18} className="text-zinc-500" />
          </motion.button>
          <div>
            <h1 className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              <TrendingUp style={{ color: STATS_THEME.accent, filter: 'drop-shadow(0 0 8px rgba(45,212,191,0.6))' }} size={22} /> STATS LAB
            </h1>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] mt-0.5 text-zinc-600" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {isLoading ? '⟳ SYNCING...' : `${totalWorkouts} WORKOUTS • ${progressEntries?.length || 0} LOGS`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          {/* Quick stats in header */}
          <div className="hidden md:flex items-center gap-6 mr-2">
            {[
              { label: 'STREAK', value: `${streak}d`, color: '#f59e0b' },
              { label: 'CONSIST', value: `${consistencyScore}%`, color: STATS_THEME.accent },
              { label: 'GOAL Δ', value: goalDelta == null ? '--' : `${goalDelta > 0 ? '+' : ''}${goalDelta}kg`, color: goalDelta == null ? '#6b7280' : goalDelta <= 0 ? '#22c55e' : STATS_THEME.hot },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="font-black italic text-lg" style={{ color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</p>
                <p className="text-[7px] uppercase tracking-widest text-zinc-700" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{s.label}</p>
              </div>
            ))}
          </div>
          <motion.button onClick={() => setShowLogModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-black" style={{ background: `linear-gradient(135deg, ${STATS_THEME.accent}, #14b8a6)`, boxShadow: '0 0 20px rgba(45,212,191,0.35)' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Plus size={16} /> LOG
          </motion.button>
        </div>
      </motion.header>

      {/* TABS */}
      <div className="sticky z-40 px-6 py-3 flex gap-2" style={{ top: '80px', background: 'rgba(4,9,9,0.82)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${STATS_THEME.borderSoft}` }}>
        {[
          { id: 'overview', label: 'OVERVIEW', icon: TrendingUp },
          { id: 'history', label: 'HISTORY', icon: Tag },
          { id: 'body', label: 'BODY COMP', icon: Activity },
          { id: 'photos', label: `PHOTOS${allPhotos.length ? ` (${allPhotos.length})` : ''}`, icon: Camera },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5" style={{
            fontFamily: 'JetBrains Mono, monospace',
            background: activeTab === tab.id ? 'rgba(45,212,191,0.15)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${activeTab === tab.id ? STATS_THEME.border : 'rgba(255,255,255,0.05)'}`,
            color: activeTab === tab.id ? STATS_THEME.accent : '#71717a'
          }}>
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10 space-y-6">

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Workouts" value={totalWorkouts} sub={`Last: ${workouts?.[0] ? new Date(workouts[0].date || workouts[0].createdAt).toLocaleDateString() : 'None'}`} icon={Target} color={STATS_THEME.accent} delay={0} />
              <StatCard label="Streak" value={`${streak}d`} sub={streak > 0 ? '🔥 Keep going!' : 'Start today!'} icon={Flame} color="#f59e0b" delay={0.05} />
              <StatCard label="Total Volume" value={`${(totalVolume / 1000).toFixed(1)}t`} sub="all time" icon={Activity} color="#a855f7" delay={0.1} />
              <StatCard label="Avg Cal/Day" value={avgCaloriesPerDay > 0 ? `${avgCaloriesPerDay}` : '--'} sub="last 30 days" icon={Zap} color="#22c55e" delay={0.15} />
            </div>

            {/* Weight + Workout Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Weight trend */}
              <SectionCard title="WEIGHT TREND" action={
                <span className="text-[8px] text-zinc-700 font-black uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {goalWeight ? `GOAL: ${goalWeight}kg` : 'SET GOAL IN PROFILE'}
                </span>
              }>
                {weightChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={weightChartData}>
                      <defs>
                        <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ff1a1a" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#ff1a1a" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="goalGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="date" tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} domain={weightYAxisDomain} />
                      <Tooltip content={<ForgeTooltip unit=" kg" />} />
                      <Area type="linear" dataKey="weight" name="Weight" stroke="#ff1a1a" strokeWidth={2} fill="url(#weightGrad)" dot={{ fill: '#ff1a1a', r: 4 }} activeDot={{ r: 6, fill: '#ff4444' }} />
                      {goalWeight && <ReferenceLine y={goalWeight} stroke="#22c55e" strokeDasharray="4 4" ifOverflow="extendDomain" />}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="No weight logs yet" sub='Click "+ LOG" to add your first entry' />
                )}
              </SectionCard>

              {/* Workout frequency */}
              <SectionCard title="WEEKLY WORKOUTS">
                {workoutFreqData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={workoutFreqData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="week" tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ForgeTooltip />} />
                      <Bar dataKey="workouts" name="Sessions" fill={STATS_THEME.accent} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="No workouts logged" sub="Complete workouts in the Workout Tracker" />
                )}
              </SectionCard>
            </div>

            {/* Nutrition Row */}
            <div className="grid lg:grid-cols-1 gap-6">
              <SectionCard title="7-DAY CALORIE INTAKE" accentColor="#22c55e">
                {calorieData.some(d => d.calories > 0) ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={calorieData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="day" tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ForgeTooltip unit=" kcal" />} />
                      <Bar dataKey="calories" name="Calories" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="protein" name="Protein (g)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="No meals logged" sub="Log meals in the Diet Tracker" />
                )}
              </SectionCard>
            </div>
          </>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <SectionCard title="PROGRESS LOG HISTORY" action={
            <motion.button onClick={() => setShowLogModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest" style={{ background: 'rgba(255,26,26,0.12)', border: '1px solid rgba(255,26,26,0.25)', color: '#ff4444', fontFamily: 'JetBrains Mono, monospace' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Plus size={12} /> NEW ENTRY
            </motion.button>
          }>
            {progressEntries?.length > 0 ? (
              <div className="space-y-3">
                {[...progressEntries].sort((a, b) => new Date(b.date) - new Date(a.date)).map(entry => (
                  <motion.div key={entry._id} className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.05)' }} layout>
                    <div className="flex items-center justify-between p-4 cursor-pointer" style={{ background: 'rgba(255,255,255,0.02)' }} onClick={() => setExpandedEntry(expandedEntry === entry._id ? null : entry._id)}>
                      <div className="flex items-center gap-4">
                        <p className="font-black text-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        <div className="flex gap-3">
                          {entry.weight && <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(255,26,26,0.1)', color: '#ff4444', fontFamily: 'JetBrains Mono, monospace' }}>{entry.weight}kg</span>}
                          {entry.bodyFat && <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7', fontFamily: 'JetBrains Mono, monospace' }}>{entry.bodyFat}% fat</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button onClick={e => { e.stopPropagation(); handleDelete(entry._id) }} className="p-1.5 rounded-lg transition-all" style={{ background: 'rgba(255,26,26,0.06)', border: '1px solid rgba(255,26,26,0.1)' }} whileHover={{ scale: 1.05 }} disabled={deletingId === entry._id}>
                          {deletingId === entry._id ? <Loader2 size={13} className="animate-spin text-red-500" /> : <Trash2 size={13} className="text-zinc-600 hover:text-red-400 transition-colors" />}
                        </motion.button>
                        {expandedEntry === entry._id ? <ChevronUp size={16} className="text-zinc-600" /> : <ChevronDown size={16} className="text-zinc-600" />}
                      </div>
                    </div>
                    <AnimatePresence>
                      {expandedEntry === entry._id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="p-4 pt-0 grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {Object.entries({
                              Chest: entry.measurements?.chest,
                              Waist: entry.measurements?.waist,
                              Hips: entry.measurements?.hips,
                              Arms: entry.measurements?.arms,
                              Legs: entry.measurements?.legs,
                            }).filter(([, v]) => v).map(([label, val]) => (
                              <div key={label} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{label}</p>
                                <p className="text-lg font-black mt-1" style={{ color: '#a855f7', fontFamily: 'JetBrains Mono, monospace' }}>{val}cm</p>
                              </div>
                            ))}
                            {entry.notes && (
                              <div className="col-span-full p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mb-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>NOTES</p>
                                <p className="text-sm text-zinc-400">{entry.notes}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState message="No entries logged" sub='Use the "+ LOG" button to track your first check-in' />
            )}
          </SectionCard>
        )}

        {/* ── BODY COMP TAB ── */}
        {activeTab === 'body' && (
          <>
            {/* Body fat trend */}
            {progressEntries?.some(e => e.bodyFat) ? (
              <SectionCard title="BODY FAT % TREND" accentColor="#a855f7">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={[...progressEntries].filter(e => e.bodyFat).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-10).map(e => ({ date: new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), bodyFat: parseFloat(e.bodyFat) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip content={<ForgeTooltip unit="%" />} />
                    <Line type="monotone" dataKey="bodyFat" name="Body Fat" stroke="#a855f7" strokeWidth={2.5} dot={{ fill: '#a855f7', r: 5 }} activeDot={{ r: 7, fill: '#c084fc' }} />
                  </LineChart>
                </ResponsiveContainer>
              </SectionCard>
            ) : (
              <SectionCard title="BODY FAT % TREND" accentColor="#a855f7">
                <EmptyState message="No body fat data" sub="Add body fat % when logging progress" />
              </SectionCard>
            )}

            {/* Measurements trend */}
            <SectionCard title="MEASUREMENTS HISTORY (cm)" accentColor="#06b6d4">
              {progressEntries?.some(e => e.measurements && Object.values(e.measurements).some(v => v)) ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        {['Date', 'Chest', 'Waist', 'Hips', 'Arms', 'Legs'].map(h => (
                          <th key={h} className="text-left pb-3 font-black uppercase tracking-widest" style={{ color: '#52525b', fontFamily: 'JetBrains Mono, monospace', fontSize: '8px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...progressEntries]
                        .filter(e => e.measurements && Object.values(e.measurements).some(v => v))
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .slice(0, 10)
                        .map(entry => (
                          <tr key={entry._id} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                            <td className="py-3 pr-4 font-bold text-zinc-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                            {['chest', 'waist', 'hips', 'arms', 'legs'].map(m => (
                              <td key={m} className="py-3 pr-4 font-black" style={{ color: entry.measurements?.[m] ? '#06b6d4' : '#27272a', fontFamily: 'JetBrains Mono, monospace' }}>
                                {entry.measurements?.[m] ? `${entry.measurements[m]}` : '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState message="No measurement data" sub="Log chest, waist, arms etc. in your progress entries" />
              )}
            </SectionCard>
          </>
        )}

        {/* ── PHOTOS TAB ── */}
        {activeTab === 'photos' && (
          <>
            {/* Upload Zone */}
            <motion.div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.04)' }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>UPLOAD BODY PHOTO</p>
                  <Camera size={16} style={{ color: '#ff4444' }} />
                </div>

                {/* Controls row */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1.5 block" style={{ fontFamily: 'JetBrains Mono, monospace' }}>DATE</label>
                    <input type="date" value={photoDate} onChange={e => setPhotoDate(e.target.value)}
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', color: '#e4e4e7', padding: '10px 14px', fontSize: '13px', width: '100%', outline: 'none', fontFamily: "'Space Grotesk', sans-serif" }}
                      onFocus={e => e.target.style.borderColor = 'rgba(255,26,26,0.4)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1.5 block" style={{ fontFamily: 'JetBrains Mono, monospace' }}>LABEL / ANGLE</label>
                    <div className="flex flex-wrap gap-1.5">
                      {PHOTO_LABELS.map(l => (
                        <button key={l} onClick={() => setPhotoLabel(l)}
                          className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all"
                          style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            background: photoLabel === l ? 'rgba(255,26,26,0.2)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${photoLabel === l ? 'rgba(255,26,26,0.4)' : 'rgba(255,255,255,0.06)'}`,
                            color: photoLabel === l ? '#ff4444' : '#52525b'
                          }}>{l}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Drop zone */}
                <motion.div
                  className="relative rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
                  style={{
                    height: '180px',
                    border: `2px dashed ${dragOver ? 'rgba(255,26,26,0.6)' : 'rgba(255,255,255,0.08)'}`,
                    background: dragOver ? 'rgba(255,26,26,0.05)' : 'rgba(255,255,255,0.015)',
                  }}
                  onClick={() => photoInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handlePhotoUpload(e.dataTransfer.files) }}
                  whileHover={{ borderColor: 'rgba(255,26,26,0.35)', background: 'rgba(255,26,26,0.03)' }}
                  whileTap={{ scale: 0.99 }}
                >
                  {uploadingPhoto ? (
                    <>
                      <Loader2 size={32} className="animate-spin" style={{ color: '#ff4444' }} />
                      <p className="text-xs font-black uppercase tracking-widest text-zinc-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>COMPRESSING & SAVING...</p>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,26,26,0.08)', border: '1px solid rgba(255,26,26,0.15)' }}>
                        <Upload size={24} style={{ color: '#ff4444' }} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black text-zinc-300">Click to upload or drag & drop</p>
                        <p className="text-[9px] text-zinc-700 mt-1 font-black uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace' }}>JPG, PNG, WEBP — Auto compressed</p>
                      </div>
                      <div className="px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #ff1a1a, #cc0000)', boxShadow: '0 0 15px rgba(255,26,26,0.25)' }}>
                        <Camera size={14} /> SELECT PHOTO
                      </div>
                    </>
                  )}
                </motion.div>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e.target.files)} />
              </div>
            </motion.div>

            {/* Gallery */}
            <motion.div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>PHOTO GALLERY</p>
                <p className="text-[9px] text-zinc-700 font-black uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{allPhotos.length} PHOTOS</p>
              </div>

              {allPhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {allPhotos.map((photo, i) => (
                    <motion.div key={i} className="relative group rounded-xl overflow-hidden cursor-pointer aspect-[3/4]"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                      onClick={() => setLightbox(photo)}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <img src={photo.src} alt={photo.label} className="w-full h-full object-cover" loading="lazy" />
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                        <div className="flex justify-end">
                          <div className="p-1.5 rounded-lg" style={{ background: 'rgba(255,26,26,0.3)', backdropFilter: 'blur(8px)' }}>
                            <ZoomIn size={14} className="text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: '#ff4444', fontFamily: 'JetBrains Mono, monospace' }}>{photo.label}</p>
                          <p className="text-[9px] text-zinc-300 font-bold">{new Date(photo.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</p>
                        </div>
                      </div>
                      {/* Always-visible label chip */}
                      <div className="absolute top-2 left-2">
                        <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.7)', color: '#ff6666', fontFamily: 'JetBrains Mono, monospace', backdropFilter: 'blur(4px)' }}>{photo.label}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,26,26,0.06)', border: '1px solid rgba(255,26,26,0.12)' }}>
                    <ImageIcon size={28} style={{ color: '#ff4444' }} />
                  </div>
                  <p className="text-zinc-500 font-black text-sm uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace' }}>NO PHOTOS YET</p>
                  <p className="text-zinc-700 text-xs text-center">Upload your first body photo above to start your visual journey</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>

      {/* ── LIGHTBOX MODAL ── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div className="fixed inset-0 z-[200] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}>
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)' }} />
            <motion.div className="relative max-w-3xl w-full" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
              onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest" style={{ background: 'rgba(255,26,26,0.2)', color: '#ff4444', fontFamily: 'JetBrains Mono, monospace', border: '1px solid rgba(255,26,26,0.3)' }}>{lightbox.label}</span>
                  <span className="text-sm text-zinc-500 font-bold">{new Date(lightbox.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <motion.button onClick={() => setLightbox(null)} className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <X size={20} className="text-zinc-400" />
                </motion.button>
              </div>
              {/* Image */}
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', maxHeight: '80vh' }}>
                <img src={lightbox.src} alt={lightbox.label} className="w-full h-full object-contain" style={{ maxHeight: '72vh', background: '#040404' }} />
              </div>
              {/* Nav hint */}
              <p className="text-center text-[9px] text-zinc-700 mt-3 font-black uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace' }}>CLICK OUTSIDE TO CLOSE</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LOG MODAL ── */}
      <AnimatePresence>
        {showLogModal && (
          <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }} onClick={() => setShowLogModal(false)} />
            <motion.div className="relative w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: '#0a0a0a', border: '1px solid rgba(255,26,26,0.15)', maxHeight: '90vh', overflowY: 'auto' }} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-black italic uppercase" style={{ fontFamily: 'JetBrains Mono, monospace' }}>LOG PROGRESS</h2>
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>SAVED TO DATABASE</p>
                  </div>
                  <button onClick={() => setShowLogModal(false)} className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <X size={18} className="text-zinc-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Date */}
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1.5 block" style={{ fontFamily: 'JetBrains Mono, monospace' }}>DATE *</label>
                    <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} onFocus={e => e.target.style.borderColor = 'rgba(255,26,26,0.4)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'} />
                  </div>

                  {/* Weight + Body Fat */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1.5 block" style={{ fontFamily: 'JetBrains Mono, monospace' }}>WEIGHT (kg)</label>
                      <input type="number" step="0.1" placeholder="75.5" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} style={inputStyle} onFocus={e => e.target.style.borderColor = 'rgba(255,26,26,0.4)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'} />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1.5 block" style={{ fontFamily: 'JetBrains Mono, monospace' }}>BODY FAT (%)</label>
                      <input type="number" step="0.1" placeholder="18.5" value={form.bodyFat} onChange={e => setForm(f => ({ ...f, bodyFat: e.target.value }))} style={inputStyle} onFocus={e => e.target.style.borderColor = 'rgba(255,26,26,0.4)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'} />
                    </div>
                  </div>

                  {/* Body Measurements */}
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2 block" style={{ fontFamily: 'JetBrains Mono, monospace' }}>MEASUREMENTS (cm) — optional</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'chest', label: 'Chest' },
                        { key: 'waist', label: 'Waist' },
                        { key: 'hips', label: 'Hips' },
                        { key: 'arms', label: 'Arms' },
                        { key: 'legs', label: 'Legs' },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="text-[8px] text-zinc-700 font-bold uppercase block mb-1">{label}</label>
                          <input type="number" step="0.1" placeholder="0" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                            style={{ ...inputStyle, padding: '8px 10px', fontSize: '13px' }}
                            onFocus={e => e.target.style.borderColor = 'rgba(255,26,26,0.4)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1.5 block" style={{ fontFamily: 'JetBrains Mono, monospace' }}>NOTES — optional</label>
                    <textarea rows={2} placeholder="How are you feeling? Any observations..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ ...inputStyle, resize: 'none' }} onFocus={e => e.target.style.borderColor = 'rgba(255,26,26,0.4)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'} />
                  </div>

                  {/* Save Button */}
                  <motion.button onClick={handleSave} disabled={saving} className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2" style={{ background: saving ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #ff1a1a, #cc0000)', boxShadow: saving ? 'none' : '0 0 25px rgba(255,26,26,0.35)' }} whileHover={{ scale: saving ? 1 : 1.02 }} whileTap={{ scale: saving ? 1 : 0.98 }}>
                    {saving ? <><Loader2 size={18} className="animate-spin" /> SAVING...</> : <><Save size={18} /> SAVE TO DATABASE</>}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ProgressPage