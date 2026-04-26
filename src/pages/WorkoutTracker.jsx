import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Plus, Trash2, Check, X, Timer, 
  ChevronRight, Activity, Calendar, Flame, Target, BarChart3, Minus,
  Bookmark, Save, FolderOpen, Edit3, MessageSquare, TrendingUp
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import toast from 'react-hot-toast'
import { EmptyState } from '../components/EmptyState'
import { WorkoutSkeleton } from '../components/LoadingSkeleton'
import { useApi, apiPost } from '../hooks/useApi'

const UI_THEME_KEY = 'uiColorTheme'
const UI_THEMES = {
  ice: {
    name: 'Graphite + Ice',
    page: 'linear-gradient(120deg, #0b0f14 0%, #0f141b 35%, #121821 70%, #0b0f14 100%)',
    glowA: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.07), transparent 42%)',
    glowB: 'radial-gradient(circle at 70% 30%, rgba(239,68,68,0.08), transparent 48%)',
    accent: '#d1d5db',
    accentSoft: 'rgba(209,213,219,0.2)'
  },
  copper: {
    name: 'Matte + Copper',
    page: 'linear-gradient(120deg, #0b0f14 0%, #0f141b 35%, #121821 70%, #0b0f14 100%)',
    glowA: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.07), transparent 42%)',
    glowB: 'radial-gradient(circle at 70% 30%, rgba(239,68,68,0.08), transparent 48%)',
    accent: '#d1d5db',
    accentSoft: 'rgba(209,213,219,0.2)'
  },
  mint: {
    name: 'Obsidian + Mint',
    page: 'linear-gradient(120deg, #0b0f14 0%, #0f141b 35%, #121821 70%, #0b0f14 100%)',
    glowA: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.07), transparent 42%)',
    glowB: 'radial-gradient(circle at 70% 30%, rgba(239,68,68,0.08), transparent 48%)',
    accent: '#d1d5db',
    accentSoft: 'rgba(209,213,219,0.2)'
  },
  crimson: {
    name: 'Crimson Steel',
    page: 'linear-gradient(120deg, #0b0f14 0%, #0f141b 35%, #121821 70%, #0b0f14 100%)',
    glowA: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.07), transparent 42%)',
    glowB: 'radial-gradient(circle at 70% 30%, rgba(239,68,68,0.08), transparent 48%)',
    accent: '#d1d5db',
    accentSoft: 'rgba(209,213,219,0.2)'
  }
}

const MATTE = {
  page: 'linear-gradient(120deg, #0b0f14 0%, #0f141b 35%, #121821 70%, #0b0f14 100%)',
  panel: 'linear-gradient(165deg, rgba(255,255,255,0.05) 0%, rgba(24,30,38,0.92) 30%, rgba(13,17,23,0.99) 72%)',
  tile: 'linear-gradient(170deg, rgba(255,255,255,0.03) 0%, rgba(20,26,34,0.95) 45%, rgba(11,15,21,1) 100%)',
  border: 'rgba(255,255,255,0.10)',
  borderSoft: 'rgba(255,255,255,0.045)',
  textSoft: '#b2bac7',
}

const MATTE_PANEL_STYLE = {
  background: MATTE.panel,
  border: `1px solid ${MATTE.borderSoft}`,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -18px 28px rgba(0,0,0,0.55), 0 14px 24px rgba(0,0,0,0.48)',
}

const MATTE_TILE_STYLE = {
  background: MATTE.tile,
  border: `1px solid ${MATTE.borderSoft}`,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 16px rgba(0,0,0,0.4)',
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

function formatWorkoutDate(rawDate) {
  const dayKey = toDayKey(rawDate)
  if (!dayKey) return 'Unknown'
  return new Date(`${dayKey}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Volume Display Card Component
const VolumeCard = ({ currentWorkout }) => {
  const totalVolume = currentWorkout.reduce((sum, exercise) => {
    const exerciseVolume = exercise.sets.reduce((setSum, set) => {
      return setSum + (set.weight * set.reps)
    }, 0)
    return sum + exerciseVolume
  }, 0)

  const completedSets = currentWorkout.reduce((count, exercise) => {
    return count + exercise.sets.filter(set => set.completed).length
  }, 0)

  return (
    <motion.div 
      className="rounded-2xl p-6"
      style={MATTE_PANEL_STYLE}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white/80 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <TrendingUp size={18} className="text-white" />
          Session Volume
        </h3>
        <Flame className="text-zinc-300" size={24} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-black text-white">
          {totalVolume.toLocaleString()}
        </span>
        <span className="text-2xl text-white/80">kg</span>
      </div>
      <p className="text-white/60 text-xs mt-2">
        {completedSets} sets completed • {currentWorkout.length} exercises
      </p>
    </motion.div>
  )
}

function WorkoutTracker() {
  const navigate = useNavigate()
  const { data: apiWorkouts, refetch: refetchWorkouts } = useApi('/workouts')
  const [themeName] = useState(() => localStorage.getItem(UI_THEME_KEY) || 'mint')
  const theme = UI_THEMES[themeName] || UI_THEMES.ice
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('today')
  const [showAddTerminal, setShowAddTerminal] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [timer, setTimer] = useState(0)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [showNoteModal, setShowNoteModal] = useState(null)
  const [noteText, setNoteText] = useState('')
  
  // Load from localStorage
  const [currentWorkout, setCurrentWorkout] = useState(() => {
    const saved = localStorage.getItem('currentWorkout')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (error) {
        console.error('Failed to load workout:', error)
        return []
      }
    }
    return []
  })

  // Load templates from localStorage
  const [workoutTemplates, setWorkoutTemplates] = useState(() => {
    const saved = localStorage.getItem('workoutTemplates')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return []
      }
    }
    return [
      {
        id: 'template1',
        name: 'Push Day',
        exercises: [
          { name: 'Bench Press', sets: [{ reps: 10, weight: 60 }, { reps: 8, weight: 70 }, { reps: 6, weight: 80 }] },
          { name: 'Shoulder Press', sets: [{ reps: 12, weight: 40 }, { reps: 10, weight: 45 }] },
          { name: 'Tricep Pushdown', sets: [{ reps: 15, weight: 30 }, { reps: 15, weight: 30 }] }
        ]
      },
      {
        id: 'template2',
        name: 'Pull Day',
        exercises: [
          { name: 'Deadlift', sets: [{ reps: 5, weight: 100 }, { reps: 5, weight: 110 }] },
          { name: 'Pull Ups', sets: [{ reps: 8, weight: 0 }, { reps: 8, weight: 0 }] },
          { name: 'Barbell Rows', sets: [{ reps: 10, weight: 60 }, { reps: 10, weight: 60 }] }
        ]
      },
      {
        id: 'template3',
        name: 'Leg Day',
        exercises: [
          { name: 'Squats', sets: [{ reps: 10, weight: 80 }, { reps: 8, weight: 90 }, { reps: 6, weight: 100 }] },
          { name: 'Romanian Deadlifts', sets: [{ reps: 12, weight: 70 }, { reps: 10, weight: 80 }] },
          { name: 'Leg Press', sets: [{ reps: 15, weight: 150 }, { reps: 12, weight: 170 }] }
        ]
      },
      {
        id: 'template4',
        name: 'Full Body',
        exercises: [
          { name: 'Squats', sets: [{ reps: 10, weight: 70 }, { reps: 8, weight: 80 }] },
          { name: 'Bench Press', sets: [{ reps: 10, weight: 60 }, { reps: 8, weight: 70 }] },
          { name: 'Barbell Rows', sets: [{ reps: 10, weight: 60 }, { reps: 10, weight: 60 }] }
        ]
      },
      {
        id: 'template5',
        name: 'Upper Body',
        exercises: [
          { name: 'Bench Press', sets: [{ reps: 10, weight: 60 }, { reps: 8, weight: 70 }] },
          { name: 'Pull Ups', sets: [{ reps: 8, weight: 0 }, { reps: 6, weight: 0 }] },
          { name: 'Shoulder Press', sets: [{ reps: 12, weight: 40 }, { reps: 10, weight: 45 }] }
        ]
      },
      {
        id: 'template6',
        name: 'Lower Body',
        exercises: [
          { name: 'Squats', sets: [{ reps: 10, weight: 80 }, { reps: 8, weight: 90 }] },
          { name: 'Romanian Deadlifts', sets: [{ reps: 12, weight: 70 }, { reps: 10, weight: 80 }] },
          { name: 'Calf Raises', sets: [{ reps: 20, weight: 50 }, { reps: 20, weight: 50 }] }
        ]
      }
    ]
  })

  // Load workout history from localStorage
  const [workoutHistory, setWorkoutHistory] = useState(() => {
    const saved = localStorage.getItem('workoutHistory')
    if (!saved) return []
    try {
      const parsed = JSON.parse(saved)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })

  const normalizedApiWorkouts = useMemo(() => {
    if (!Array.isArray(apiWorkouts)) return []
    return apiWorkouts.map((w, idx) => ({
      id: w._id || w.id || `workout-${toDayKey(w.date || w.createdAt) || 'unknown'}-${idx}`,
      _id: w._id,
      date: toDayKey(w.date || w.createdAt) || new Date().toISOString().split('T')[0],
      exercises: Number(w.exercises) || 0,
      completedSets: Number(w.completedSets) || 0,
      volume: Number(w.volume) || 0,
      calories: Number(w.calories) || 0,
      duration: Number(w.duration) || 0,
      fullWorkout: Array.isArray(w.workoutData) ? w.workoutData : (w.fullWorkout || []),
      createdAt: w.createdAt || undefined,
    }))
  }, [apiWorkouts])

  useEffect(() => {
    if (normalizedApiWorkouts.length > 0) {
      setWorkoutHistory(normalizedApiWorkouts)
    }
  }, [normalizedApiWorkouts])

  useEffect(() => {
    localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory))
  }, [workoutHistory])

  useEffect(() => {
    localStorage.setItem('currentWorkout', JSON.stringify(currentWorkout))
  }, [currentWorkout])

  useEffect(() => {
    localStorage.setItem('workoutTemplates', JSON.stringify(workoutTemplates))
  }, [workoutTemplates])

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 800)
  }, [])

  const [newExercise, setNewExercise] = useState({ 
    name: '', 
    sets: [{ weight: 0, reps: 10 }] 
  })

  // Rest Timer Logic
  useEffect(() => {
    let interval = null
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => setTimer(timer - 1), 1000)
    } else if (timer === 0) {
      setIsTimerActive(false)
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isTimerActive, timer])

  const toggleSetComplete = (exerciseId, setIndex) => {
    setCurrentWorkout(prevWorkout => 
      prevWorkout.map(exercise => {
        if (exercise.id === exerciseId) {
          const updatedSets = exercise.sets.map((set, i) => {
            if (i === setIndex) {
              const newState = !set.completed
              if (newState) {
                setTimer(60)
                setIsTimerActive(true)
              }
              return { ...set, completed: newState }
            }
            return set
          })
          return { ...exercise, sets: updatedSets }
        }
        return exercise
      })
    )
  }

  // Save note for a set
  const saveNote = () => {
    if (showNoteModal) {
      setCurrentWorkout(prevWorkout =>
        prevWorkout.map(exercise => {
          if (exercise.id === showNoteModal.exerciseId) {
            const updatedSets = exercise.sets.map((set, i) => {
              if (i === showNoteModal.setIndex) {
                return { ...set, notes: noteText }
              }
              return set
            })
            return { ...exercise, sets: updatedSets }
          }
          return exercise
        })
      )
      setShowNoteModal(null)
      setNoteText('')
      toast.success('Note saved')
    }
  }

  // Finish workout and save to history
  const finishWorkout = async () => {
    if (currentWorkout.length === 0) {
      toast.error('No exercises to save!')
      return
    }
    
    // Calculate total volume (weight • ? reps for all sets)
    const totalVolume = currentWorkout.reduce((sum, exercise) => {
      const exerciseVolume = exercise.sets.reduce((setSum, set) => {
        return setSum + (set.weight * set.reps)
      }, 0)
      return sum + exerciseVolume
    }, 0)
    
    // Count completed sets
    const completedSets = currentWorkout.reduce((count, exercise) => {
      return count + exercise.sets.filter(set => set.completed).length
    }, 0)
    
    // Estimate calories (rough: 1kg lifted = 0.1 calories)
    const estimatedCalories = Math.round(totalVolume * 0.1)
    
    const dayKey = new Date().toISOString().split('T')[0]
    const workout = {
      id: Date.now(),
      date: dayKey,
      exercises: currentWorkout.length,
      completedSets: completedSets,
      volume: totalVolume,
      calories: estimatedCalories,
      duration: 45,
      fullWorkout: currentWorkout,
      createdAt: new Date().toISOString(),
    }

    setWorkoutHistory(prev => [workout, ...prev])
    setCurrentWorkout([])

    const saved = await apiPost('/workouts', {
      date: dayKey,
      exercises: workout.exercises,
      completedSets: workout.completedSets,
      volume: workout.volume,
      calories: workout.calories,
      duration: workout.duration,
      workoutData: workout.fullWorkout,
    })

    if (saved) {
      refetchWorkouts()
    }

    toast.success(`✓ Workout Saved!\nVolume: ${totalVolume.toLocaleString()}kg`, {
      duration: 5000,
    })
    setActiveTab('analytics')
  }

  // Open note modal
  const openNoteModal = (exerciseId, setIndex, currentNote = '') => {
    setShowNoteModal({ exerciseId, setIndex })
    setNoteText(currentNote)
  }

  const addSetField = () => {
    setNewExercise(prev => ({
      ...prev,
      sets: [...prev.sets, { weight: 0, reps: 10 }]
    }))
  }

  const removeSetField = (index) => {
    if (newExercise.sets.length > 1) {
      setNewExercise(prev => ({
        ...prev,
        sets: prev.sets.filter((_, i) => i !== index)
      }))
    }
  }

  const updateSet = (index, field, value) => {
    setNewExercise(prev => {
      const newSets = [...prev.sets]
      newSets[index] = { 
        ...newSets[index], 
        [field]: value === '' ? 0 : parseFloat(value) 
      }
      return { ...prev, sets: newSets }
    })
  }

  const addExercise = () => {
    if (!newExercise.name.trim()) {
      toast.error('Please enter an exercise name')
      return
    }
    
    setCurrentWorkout(prev => [...prev, {
      id: Date.now(),
      name: newExercise.name.trim(),
      sets: newExercise.sets.map(set => ({
        reps: parseInt(set.reps) || 10,
        weight: parseFloat(set.weight) || 0,
        completed: false,
        notes: ''
      }))
    }])
    setNewExercise({ name: '', sets: [{ weight: 0, reps: 10 }] })
    setShowAddTerminal(false)
    toast.success('Exercise added!')
  }

  // Save current workout as template
  const saveAsTemplate = () => {
    if (currentWorkout.length === 0) {
      toast.error('No exercises to save!')
      return
    }
    setShowCreateTemplate(true)
  }

  const createTemplate = () => {
    if (!newTemplateName.trim()) {
      toast.error('Please enter a template name')
      return
    }

    const newTemplate = {
      id: Date.now().toString(),
      name: newTemplateName,
      exercises: currentWorkout.map(ex => ({
        name: ex.name,
        sets: ex.sets.map(set => ({
          reps: set.reps,
          weight: set.weight
        }))
      }))
    }

    setWorkoutTemplates(prev => [newTemplate, ...prev])
    setNewTemplateName('')
    setShowCreateTemplate(false)
    toast.success('Template saved!')
  }

  // Load template into current workout
  const loadTemplate = (template) => {
    const newWorkout = template.exercises.map((ex, index) => ({
      id: Date.now() + index,
      name: ex.name,
      sets: ex.sets.map(set => ({
        reps: set.reps,
        weight: set.weight,
        completed: false,
        notes: ''
      }))
    }))

    setCurrentWorkout(newWorkout)
    setShowTemplates(false)
    toast.success(`Loaded "${template.name}" template`)
  }

  // Delete template
  const deleteTemplate = (templateId) => {
    if (window.confirm('Delete this template?')) {
      setWorkoutTemplates(prev => prev.filter(t => t.id !== templateId))
      toast.success('Template deleted')
    }
  }

  const totalExercises = currentWorkout.length
  const completedSets = currentWorkout.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0)
  const totalSets = currentWorkout.reduce((sum, ex) => sum + ex.sets.length, 0)
  const completionRate = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0

  const sortedHistory = useMemo(() => {
    return [...workoutHistory].sort((a, b) => {
      const aKey = toDayKey(a.date || a.createdAt)
      const bKey = toDayKey(b.date || b.createdAt)
      const aTs = aKey ? new Date(`${aKey}T00:00:00`).getTime() : 0
      const bTs = bKey ? new Date(`${bKey}T00:00:00`).getTime() : 0
      if (aTs !== bTs) return bTs - aTs
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })
  }, [workoutHistory])

  const analyticsHistory = useMemo(() => {
    return sortedHistory.slice(0, 7).reverse().map((w) => ({
      ...w,
      label: formatWorkoutDate(w.date || w.createdAt),
    }))
  }, [sortedHistory])

  const strengthProgression = useMemo(() => {
    const getMaxForKeywords = (exercises, keywords) => {
      if (!Array.isArray(exercises)) return 0
      return exercises.reduce((maxWeight, ex) => {
        const name = String(ex?.name || '').toLowerCase()
        const matches = keywords.some((k) => name.includes(k))
        if (!matches || !Array.isArray(ex?.sets)) return maxWeight
        const exMax = ex.sets.reduce((m, s) => Math.max(m, Number(s?.weight) || 0), 0)
        return Math.max(maxWeight, exMax)
      }, 0)
    }

    return sortedHistory
      .slice(0, 8)
      .reverse()
      .map((w) => {
        const exercises = Array.isArray(w.fullWorkout) ? w.fullWorkout : []
        return {
          week: formatWorkoutDate(w.date || w.createdAt),
          bench: getMaxForKeywords(exercises, ['bench']),
          squat: getMaxForKeywords(exercises, ['squat']),
          deadlift: getMaxForKeywords(exercises, ['deadlift', 'romanian deadlift', 'rdl']),
        }
      })
      .filter((r) => r.bench > 0 || r.squat > 0 || r.deadlift > 0)
  }, [sortedHistory])

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const point = payload?.[0]?.payload
    return (
      <div className="rounded-xl p-4 shadow-lg backdrop-blur-sm" style={MATTE_TILE_STYLE}>
        <p className="font-bold text-sm mb-2 text-zinc-300">{label}</p>
        <div className="space-y-1.5">
          {payload.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-slate-300">{item.name}:</span>
              <span className="font-bold" style={{ color: item.color }}>
                {item.value}{item.dataKey === 'volume' ? ' kg' : item.dataKey === 'calories' ? ' kcal' : ''}
              </span>
            </div>
          ))}
        </div>
        {point?.duration ? (
          <div className="mt-2 px-2 py-1 rounded text-[10px] font-bold text-zinc-300" style={{ background: 'rgba(255,255,255,0.06)' }}>
            Total Duration: {point.duration} min
          </div>
        ) : null}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen text-slate-100 p-8" style={{ background: theme.page }}>
        <WorkoutSkeleton />
      </div>
    )
  }

  return (
    <div className="min-h-screen text-slate-100 font-sans overflow-x-hidden relative" style={{ background: theme.page }}>
      <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
      <div className="absolute inset-0" style={{ background: theme.glowA }} />
      <div className="absolute inset-0" style={{ background: theme.glowB }} />
      
      {/* HEADER */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl p-4 px-6 lg:px-10 flex justify-between items-center" style={{ background: MATTE.panel, borderBottom: `1px solid ${MATTE.border}` }}>
        <div className="flex items-center gap-5">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2.5 rounded-lg transition-colors"
            style={MATTE_TILE_STYLE}
          >
            <ArrowLeft className="text-zinc-400 hover:text-zinc-100" size={22} />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Activity className="text-zinc-300" size={28} />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-100">Workout Tracker</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] mt-1" style={{ color: MATTE.textSoft }}>Active training session</p>
            </div>
          </div>
        </div>
        
        {/* STATS HUD */}
        <div className="flex items-center gap-6">
          <AnimatePresence>
            {timer > 0 && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-2 text-zinc-200 font-mono text-sm font-medium px-4 py-2 rounded-full"
                style={MATTE_TILE_STYLE}
              >
                <Timer size={16} className="animate-pulse" />
                <span>{timer}s rest</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="hidden md:flex items-center gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-zinc-300">
                {totalExercises}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Exercises</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-200">
                {completedSets}/{totalSets}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Sets completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-zinc-300">
                {completionRate}%
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Session progress</div>
            </div>
          </div>
          
          {/* Template Button */}
          <button 
            onClick={() => setShowTemplates(true)} 
            className="p-3 rounded-xl transition-all mr-2"
            style={MATTE_TILE_STYLE}
            title="Load Template"
          >
            <FolderOpen size={24} className="text-slate-400" />
          </button>
          
          {/* Save Template Button */}
          <button 
            onClick={saveAsTemplate} 
            className="p-3 rounded-xl transition-all mr-2"
            style={MATTE_TILE_STYLE}
            title="Save as Template"
          >
            <Save size={24} className="text-slate-400" />
          </button>
          
          <button 
            onClick={() => setShowAddTerminal(true)} 
            className="p-3 rounded-xl transition-all"
            style={{ background: 'linear-gradient(160deg, #f4f4f5 0%, #52525b 36%, #18181b 70%, #09090b 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45), 0 10px 20px rgba(0,0,0,0.45)' }}
          >
            <Plus size={24} strokeWidth={2.5} className="text-white" />
          </button>
        </div>
      </header>

      <main className="w-full pt-28 px-4 md:px-8 lg:px-10 pb-24 relative z-10">
        {/* TABS */}
        <div className="flex gap-6 border-b mb-10 px-1" style={{ borderColor: MATTE.borderSoft }}>
          {['today', 'analytics'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-[11px] font-bold uppercase tracking-[0.18em] transition-all relative group ${
                activeTab === tab 
                  ? 'text-zinc-200' 
                  : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              {tab === 'today' ? 'Current Session' : 'Performance Analytics'}
              {activeTab === tab && (
                <motion.div 
                  layoutId="tabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: 'linear-gradient(90deg, #f4f4f5, #6b7280)' }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'today' ? (
            <motion.div 
              key="today" 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              {/* Volume Card */}
              {currentWorkout.length > 0 && (
                <VolumeCard currentWorkout={currentWorkout} />
              )}

              {currentWorkout.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="No Workout Started"
                  message="Add your first exercise or load a template to begin tracking your progress."
                  action={{
                    label: "Add Exercise",
                    onClick: () => setShowAddTerminal(true)
                  }}
                />
              ) : (
                currentWorkout.map((ex, exIdx) => (
                  <motion.div
                    key={ex.id}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: exIdx * 0.1 }}
                    className="rounded-2xl overflow-hidden group transition-all"
                    style={MATTE_PANEL_STYLE}
                  >
                    <div className="flex justify-between items-center p-6 border-b" style={{ background: MATTE.tile, borderColor: MATTE.borderSoft }}>
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-zinc-200 font-bold text-lg" style={MATTE_TILE_STYLE}>
                          {exIdx + 1}
                        </div>
                        <h2 className="text-2xl font-bold text-slate-100">
                          {ex.name}
                        </h2>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setCurrentWorkout(currentWorkout.filter(e => e.id !== ex.id))}
                        className="p-2.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={20} />
                      </motion.button>
                    </div>

                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {ex.sets.map((set, sIdx) => (
                        <motion.div 
                          key={sIdx}
                          className={`relative p-5 rounded-xl border-2 transition-all duration-300 ${
                            set.completed 
                              ? 'bg-gradient-to-br from-zinc-200 to-zinc-500 border-zinc-300 text-black'
                              : 'border-slate-800 hover:border-zinc-500/50'
                          }`}
                          style={!set.completed ? MATTE_TILE_STYLE : undefined}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span className={`text-xs font-medium uppercase tracking-wide ${
                              set.completed ? 'text-black/80' : 'text-zinc-300'
                            }`}>
                              Set {sIdx + 1}
                            </span>
                            <div className="flex gap-2">
                              {/* Note Button */}
                              <button
                                onClick={() => openNoteModal(ex.id, sIdx, set.notes || '')}
                                className={`p-1.5 rounded-lg transition-all ${
                                  set.notes 
                                    ? 'text-zinc-200 bg-white/10' 
                                    : 'text-slate-500 hover:text-zinc-200 hover:bg-white/10'
                                }`}
                                title={set.notes || 'Add note'}
                              >
                                <MessageSquare size={14} />
                              </button>
                              
                              {/* Complete Checkbox */}
                              <button
                                onClick={() => toggleSetComplete(ex.id, sIdx)}
                                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                  set.completed 
                                    ? 'bg-white border-white scale-110' 
                                    : 'border-zinc-400/40 bg-slate-800 hover:border-zinc-300'
                                }`}
                              >
                                {set.completed && (
                                  <Check size={16} strokeWidth={3} className="text-zinc-700" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-baseline gap-3">
                              <p className="text-2xl md:text-3xl font-bold">
                                {set.weight}
                                <span className="text-sm ml-1 opacity-70">kg</span>
                              </p>
                              <p className={`text-sm font-medium ${
                                set.completed ? 'text-white/80' : 'text-zinc-400'
                              }`}>
                                {set.reps} reps
                              </p>
                            </div>
                            
                            {/* Show note if exists */}
                            {set.notes && (
                                <div className="mt-2 pt-2 border-t border-zinc-400/30">
                                <div className="flex items-start gap-1.5 text-xs font-medium text-white/80">
                                  <MessageSquare size={12} className="text-zinc-300 flex-shrink-0 mt-0.5" />
                                  <span className="italic">{set.notes}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))
              )}
              
              {currentWorkout.length > 0 && (
                <motion.button
                  onClick={finishWorkout}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-5 rounded-2xl font-bold text-lg text-white transition-all mt-2"
                  style={{ background: 'linear-gradient(160deg, #f4f4f5 0%, #52525b 36%, #18181b 70%, #09090b 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45), 0 16px 30px rgba(0,0,0,0.5)' }}
                >
                  ✓ Finish Workout & Save
                  <ChevronRight size={18} className="inline ml-2" />
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="analytics" 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {workoutHistory.length === 0 ? (
                <EmptyState
                  icon={BarChart3}
                  title="No Workout History"
                  message="Complete your first workout to see analytics and track your progress!"
                />
              ) : (
                <>
                  {/* WORKOUT VOLUME & CALORIES CHART */}
                  <div className="rounded-2xl p-6" style={MATTE_PANEL_STYLE}>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold flex items-center gap-2.5 text-slate-100">
                          <BarChart3 className="text-zinc-300" size={24} />
                          Training Volume Analytics
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">Recent workout sessions</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1.5 text-xs">
                          <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
                          <span>Volume (kg)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                          <span>Calories</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="h-[300px] -mx-4 min-w-0">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <LineChart data={analyticsHistory} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                          <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                          <XAxis 
                            dataKey="label" 
                            stroke="#64748b" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={{ stroke: '#334155' }} 
                          />
                          <YAxis 
                            yAxisId="left" 
                            stroke="#60a5fa" 
                            fontSize={11} 
                            tickLine={false} 
                            axisLine={false} 
                            width={45}
                          />
                          <YAxis 
                            yAxisId="right" 
                            stroke="#f87171" 
                            fontSize={11} 
                            tickLine={false} 
                            axisLine={false} 
                            orientation="right" 
                            width={45}
                          />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.5 }} />
                          
                          <Line 
                            yAxisId="left" 
                            type="monotone" 
                            dataKey="volume" 
                            stroke="#d1d5db" 
                            strokeWidth={2.5} 
                            dot={{ fill: '#d1d5db', strokeWidth: 2, r: 4 }} 
                            activeDot={{ r: 7 }} 
                          />
                          
                          <Line 
                            yAxisId="right" 
                            type="monotone" 
                            dataKey="calories" 
                            stroke="#f87171" 
                            strokeWidth={2.5} 
                            dot={{ fill: '#f87171', strokeWidth: 2, r: 4 }} 
                            activeDot={{ r: 7 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 rounded-xl" style={MATTE_TILE_STYLE}>
                        <div className="text-xs text-slate-500 mb-1">Avg Volume</div>
                        <div className="font-bold text-lg text-zinc-300">
                          {workoutHistory.length > 0 ? Math.round(workoutHistory.reduce((sum, d) => sum + d.volume, 0) / workoutHistory.length).toLocaleString() : 0}
                        </div>
                        <div className="text-[10px] text-slate-600">kg/session</div>
                      </div>
                      <div className="text-center p-3 rounded-xl" style={MATTE_TILE_STYLE}>
                        <div className="text-xs text-slate-500 mb-1">Avg Calories</div>
                        <div className="font-bold text-lg text-red-300">
                          {workoutHistory.length > 0 ? Math.round(workoutHistory.reduce((sum, d) => sum + d.calories, 0) / workoutHistory.length) : 0}
                        </div>
                        <div className="text-[10px] text-slate-600">kcal/session</div>
                      </div>
                      <div className="text-center p-3 rounded-xl" style={MATTE_TILE_STYLE}>
                        <div className="text-xs text-slate-500 mb-1">Avg Duration</div>
                        <div className="font-bold text-lg text-zinc-300">
                          {workoutHistory.length > 0 ? Math.round(workoutHistory.reduce((sum, d) => sum + d.duration, 0) / workoutHistory.length) : 0}
                        </div>
                        <div className="text-[10px] text-slate-600">min/session</div>
                      </div>
                      <div className="text-center p-3 rounded-xl" style={MATTE_TILE_STYLE}>
                        <div className="text-xs text-slate-500 mb-1">Total Sessions</div>
                        <div className="font-bold text-lg text-zinc-300">
                          {workoutHistory.length}
                        </div>
                        <div className="text-[10px] text-slate-600">completed</div>
                      </div>
                    </div>
                  </div>

                  {/* STRENGTH PROGRESSION CHART */}
                  <div className="rounded-2xl p-6" style={MATTE_PANEL_STYLE}>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold flex items-center gap-2.5 text-slate-100">
                          <Target className="text-zinc-300" size={24} />
                          Strength Progression
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">Weight lifted over time</p>
                      </div>
                    </div>
                    
                    <div className="h-[260px] -mx-4 min-w-0">
                      {strengthProgression.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-500 text-sm px-4 text-center">
                          Log Bench, Squat, or Deadlift in workouts to see strength progression.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                          <BarChart data={strengthProgression} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                            <XAxis 
                              dataKey="week" 
                              stroke="#64748b" 
                              fontSize={12} 
                              tickLine={false} 
                              axisLine={{ stroke: '#334155' }} 
                            />
                            <YAxis 
                              stroke="#64748b" 
                              fontSize={11} 
                              tickLine={false} 
                              axisLine={false} 
                              width={40}
                            />
                            <Tooltip 
                              cursor={{ fill: '#334155', opacity: 0.5 }}
                              contentStyle={{ 
                                backgroundColor: '#1e293b', 
                                border: '1px solid #334155', 
                                borderRadius: '10px'
                              }}
                              labelStyle={{ color: '#cbd5e1', fontWeight: 500 }}
                            />
                            
                            <Bar dataKey="bench" fill="#d1d5db" radius={[6, 6, 0, 0]} barSize={25}>
                              {strengthProgression.map((entry, index) => (
                                <Cell key={`cell-bench-${index}`} fill="#d1d5db" />
                              ))}
                            </Bar>
                            <Bar dataKey="squat" fill="#a1a1aa" radius={[6, 6, 0, 0]} barSize={25}>
                              {strengthProgression.map((entry, index) => (
                                <Cell key={`cell-squat-${index}`} fill="#a1a1aa" />
                              ))}
                            </Bar>
                            <Bar dataKey="deadlift" fill="#f87171" radius={[6, 6, 0, 0]} barSize={25}>
                              {strengthProgression.map((entry, index) => (
                                <Cell key={`cell-deadlift-${index}`} fill="#f87171" />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    
                    <div className="mt-5 flex justify-center gap-5">
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
                        <span>Bench Press</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-500" />
                        <span>Squat</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <span>Deadlift</span>
                      </div>
                    </div>
                  </div>

                  {/* RECENT WORKOUTS LIST */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-slate-200 mb-4">Recent Workouts</h3>
                    {sortedHistory.slice(0, 10).map((h, i) => (
                      <motion.div
                        key={h._id || h.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-xl p-4 transition-all"
                        style={MATTE_TILE_STYLE}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-zinc-500/15 to-zinc-700/15 rounded-lg flex items-center justify-center text-zinc-300 border border-zinc-500/20">
                              <Calendar size={20} />
                            </div>
                            <div>
                              <p className="font-medium text-lg text-slate-100">{formatWorkoutDate(h.date || h.createdAt)}</p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {h.exercises} exercises • {h.completedSets} sets • {(Number(h.volume) || 0).toLocaleString()}kg
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-xl text-red-300">
                              +{Number(h.calories) || 0}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">calories burned</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ADD EXERCISE MODAL */}
      <AnimatePresence>
        {showAddTerminal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowAddTerminal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-2xl rounded-2xl p-7 shadow-2xl max-h-[90vh] overflow-y-auto"
              style={MATTE_PANEL_STYLE}
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowAddTerminal(false)} 
                className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors"
              >
                <X size={28} strokeWidth={2} />
              </button>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-100">Add New Exercise</h2>
                  <p className="text-slate-500">Enter exercise details with custom weights per set</p>
                </div>

                <input 
                  autoFocus
                  type="text" 
                  value={newExercise.name} 
                  onChange={e => setNewExercise({...newExercise, name: e.target.value})}
                  placeholder="Exercise name (e.g., Bench Press)" 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-lg font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/30 transition-all"
                />

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-200">Sets</h3>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={addSetField}
                      className="flex items-center gap-1.5 text-zinc-300 hover:text-zinc-200 font-medium text-sm"
                    >
                      <Plus size={18} strokeWidth={2.5} />
                      Add Set
                    </motion.button>
                  </div>
                  
                  {newExercise.sets.map((set, index) => (
                    <div key={index} className="flex items-end gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-slate-400 block mb-1.5">Weight (kg)</label>
                        <input 
                          type="number" 
                          value={set.weight} 
                          onChange={e => updateSet(index, 'weight', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-lg font-medium text-center text-white focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/30 transition-all"
                          placeholder="0"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-medium text-slate-400 block mb-1.5">Reps</label>
                        <input 
                          type="number" 
                          value={set.reps} 
                          onChange={e => updateSet(index, 'reps', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-lg font-medium text-center text-white focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/30 transition-all"
                          placeholder="10"
                        />
                      </div>
                      {newExercise.sets.length > 1 && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeSetField(index)}
                          className="text-red-500 hover:text-red-400 p-2.5 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="Remove set"
                        >
                          <Minus size={20} strokeWidth={2.5} />
                        </motion.button>
                      )}
                    </div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addExercise}
                  disabled={!newExercise.name.trim()}
                  className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all mt-2 flex items-center justify-center gap-2.5 ${
                    newExercise.name.trim() 
                      ? 'bg-gradient-to-r from-zinc-300 to-zinc-500 hover:from-zinc-200 hover:to-zinc-400 text-slate-900 shadow-zinc-500/30' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Plus size={22} strokeWidth={2.5} />
                  Add to Workout
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TEMPLATES MODAL */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowTemplates(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-3xl rounded-2xl p-7 shadow-2xl max-h-[80vh] overflow-y-auto"
              style={MATTE_PANEL_STYLE}
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowTemplates(false)} 
                className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors"
              >
                <X size={28} strokeWidth={2} />
              </button>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                    <Bookmark className="text-zinc-300" size={28} />
                    Workout Templates
                  </h2>
                  <p className="text-slate-500">Load a saved template to start your workout</p>
                </div>

                {workoutTemplates.length === 0 ? (
                  <EmptyState
                    icon={FolderOpen}
                    title="No Templates"
                    message="Save your current workout as a template to get started."
                  />
                ) : (
                  <div className="space-y-3">
                    {workoutTemplates.map(template => (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 hover:border-zinc-500/30 transition-all group"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-2">{template.name}</h3>
                            <div className="flex flex-wrap gap-2">
                              {template.exercises.map((ex, i) => (
                                <span key={i} className="text-xs bg-slate-700 text-slate-300 px-3 py-1 rounded-full">
                                  {ex.name}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => loadTemplate(template)}
                              className="px-4 py-2 bg-zinc-300 hover:bg-zinc-200 text-slate-900 font-bold rounded-lg text-sm transition-all"
                            >
                              Load
                            </button>
                            <button
                              onClick={() => deleteTemplate(template.id)}
                              className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE TEMPLATE MODAL */}
      <AnimatePresence>
        {showCreateTemplate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreateTemplate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-md rounded-2xl p-7 shadow-2xl"
              style={MATTE_PANEL_STYLE}
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowCreateTemplate(false)} 
                className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors"
              >
                <X size={24} strokeWidth={2} />
              </button>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                    <Save className="text-zinc-300" size={24} />
                    Save as Template
                  </h2>
                  <p className="text-slate-500">Give your template a name</p>
                </div>

                <input 
                  autoFocus
                  type="text" 
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g., Push Day, Full Body, etc." 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-lg font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/30 transition-all"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCreateTemplate(false)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createTemplate}
                    className="flex-1 py-3 bg-gradient-to-r from-zinc-300 to-zinc-500 hover:from-zinc-200 hover:to-zinc-400 text-slate-900 font-bold rounded-xl transition-all"
                  >
                    Save Template
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NOTE MODAL */}
      <AnimatePresence>
        {showNoteModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowNoteModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-md rounded-2xl p-7 shadow-2xl"
              style={MATTE_PANEL_STYLE}
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowNoteModal(null)} 
                className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors"
              >
                <X size={24} strokeWidth={2} />
              </button>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                    <MessageSquare className="text-zinc-300" size={24} />
                    Add Note
                  </h2>
                  <p className="text-slate-500">How did this set feel?</p>
                </div>

                <textarea
                  autoFocus
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="e.g., Felt heavy, good form, add weight next time..."
                  rows={4}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-lg font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/30 transition-all resize-none"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowNoteModal(null)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveNote}
                    className="flex-1 py-3 bg-gradient-to-r from-zinc-300 to-zinc-500 hover:from-zinc-200 hover:to-zinc-400 text-slate-900 font-bold rounded-xl transition-all"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default WorkoutTracker