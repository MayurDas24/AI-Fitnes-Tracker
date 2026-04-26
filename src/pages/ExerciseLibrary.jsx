import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Search, Dumbbell, Target, Zap, 
  TrendingUp, Activity, Heart, Filter, X, Play,
  Repeat, Star, Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { generateWithAI } from '../utils/ai'
import { ExerciseSkeleton } from '../components/LoadingSkeleton'
import { EmptyState } from '../components/EmptyState'
import toast from 'react-hot-toast'

import { EXERCISE_DATA, CATEGORY_ACCENTS } from '../data/exerciseLibraryData'

function ExerciseLibrary() {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState('chest')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedDifficulty, setSelectedDifficulty] = useState([])
  const [selectedEquipment, setSelectedEquipment] = useState([])
  const [expandedExercise, setExpandedExercise] = useState(null)
  const [showSubstitutions, setShowSubstitutions] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Favorites state
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favoriteExercises')
    return saved ? JSON.parse(saved) : []
  })

  // Show only favorites toggle
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)

  // AI Recommendation state
  const [aiRecommendations, setAiRecommendations] = useState([])
  const [showAIRecommendations, setShowAIRecommendations] = useState(false)
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [aiError, setAiError] = useState(false)

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('favoriteExercises', JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 800)
  }, [])

  const categories = [
    { id: 'chest', name: 'Chest', icon: Heart, color: 'red' },
    { id: 'back', name: 'Back', icon: Activity, color: 'blue' },
    { id: 'arms', name: 'Arms', icon: Zap, color: 'orange' },
    { id: 'legs', name: 'Legs', icon: TrendingUp, color: 'purple' },
    { id: 'shoulders', name: 'Shoulders', icon: Target, color: 'teal' },
    { id: 'core', name: 'Core', icon: Dumbbell, color: 'amber' }
  ]

  // Flatten all exercises for global search
  const allExercises = Object.values(EXERCISE_DATA).flat();
  const allEquipment = [...new Set(allExercises.map(ex => ex.equipment))].sort((a, b) => a.localeCompare(b))
  const allDifficulties = ['Beginner', 'Intermediate', 'Advanced']

  const normalizeTag = (value) => String(value || '').trim().toLowerCase()

  const toggleFavorite = (exerciseId) => {
    setFavorites(prev => {
      if (prev.includes(exerciseId)) {
        toast.success('Removed from favorites', { icon: '⭐' })
        return prev.filter(id => id !== exerciseId)
      } else {
        toast.success('Added to favorites!', { icon: '⭐' })
        return [...prev, exerciseId]
      }
    })
  }

  // Check if exercise is favorite
  const isFavorite = (exerciseId) => favorites.includes(exerciseId)

  // Get AI recommendations based on search
  const getAIRecommendations = async () => {
    if (!searchTerm.trim()) return
    
    setIsLoadingAI(true)
    setAiError(false)
    
    const prompt = `Suggest 5 exercises for someone searching for "${searchTerm}" related to fitness and strength training.
    
    Format as JSON array like this:
    [
      {
        "name": "Exercise Name",
        "description": "Brief description",
        "difficulty": "Beginner/Intermediate/Advanced",
        "equipment": "Required equipment"
      }
    ]
    
    Make them realistic and effective.`
    
    try {
      const aiResponse = await generateWithAI(prompt, 'workout')
      
      if (aiResponse) {
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          const recommendations = JSON.parse(jsonMatch[0])
          setAiRecommendations(recommendations)
          setShowAIRecommendations(true)
        } else {
          throw new Error('No JSON found')
        }
      } else {
        setAiError(true)
      }
    } catch (error) {
      console.error('AI recommendation failed:', error)
      setAiError(true)
    } finally {
      setIsLoadingAI(false)
    }
  }

  // Logic: Show category items OR search results OR favorites
  let baseList = []
  if (showOnlyFavorites) {
    baseList = allExercises.filter(ex => favorites.includes(ex.id))
  } else {
    baseList = searchTerm ? allExercises : (EXERCISE_DATA[selectedCategory] || [])
  }

  const filteredExercises = baseList.filter(exercise => {
    const difficultyFilters = selectedDifficulty.map(normalizeTag)
    const equipmentFilters = selectedEquipment.map(normalizeTag)
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          exercise.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDifficulty = difficultyFilters.length === 0 || difficultyFilters.includes(normalizeTag(exercise.difficulty))
    const matchesEquipment = equipmentFilters.length === 0 || equipmentFilters.includes(normalizeTag(exercise.equipment))
    return matchesSearch && matchesDifficulty && matchesEquipment
  })

  // Get substitution exercises
  const getSubstitutions = (exercise) => {
    if (!exercise.substitutions || exercise.substitutions.length === 0) return []
    
    return exercise.substitutions
      .map(subId => {
        for (const category in EXERCISE_DATA) {
          const found = EXERCISE_DATA[category].find(ex => ex.id === subId)
          if (found) return found
        }
        return null
      })
      .filter(ex => ex !== null)
  }

  const toggleDifficulty = (difficulty) => {
    const normalized = normalizeTag(difficulty)
    setSelectedDifficulty(prev => {
      const exists = prev.some(d => normalizeTag(d) === normalized)
      return exists ? prev.filter(d => normalizeTag(d) !== normalized) : [...prev, difficulty]
    })
  }

  const toggleEquipment = (equipment) => {
    const normalized = normalizeTag(equipment)
    setSelectedEquipment(prev => {
      const exists = prev.some(e => normalizeTag(e) === normalized)
      return exists ? prev.filter(e => normalizeTag(e) !== normalized) : [...prev, equipment]
    })
  }

  const applyDifficultyTag = (difficulty) => {
    const normalized = normalizeTag(difficulty)
    const isOnlySelected = selectedDifficulty.length === 1 && normalizeTag(selectedDifficulty[0]) === normalized
    setSelectedDifficulty(isOnlySelected ? [] : [difficulty])
    if (showOnlyFavorites) setShowOnlyFavorites(false)
  }

  const applyEquipmentTag = (equipment) => {
    const normalized = normalizeTag(equipment)
    const isOnlySelected = selectedEquipment.length === 1 && normalizeTag(selectedEquipment[0]) === normalized
    setSelectedEquipment(isOnlySelected ? [] : [equipment])
    if (showOnlyFavorites) setShowOnlyFavorites(false)
  }

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Beginner': return 'bg-emerald-500/15 text-emerald-200 border border-emerald-300/40'
      case 'Intermediate': return 'bg-sky-500/15 text-sky-200 border border-sky-300/40'
      case 'Advanced': return 'bg-rose-500/15 text-rose-200 border border-rose-300/40'
      default: return 'bg-slate-500/15 text-slate-200 border border-slate-300/40'
    }
  }

  const activeFilterCount = selectedDifficulty.length + selectedEquipment.length + (showOnlyFavorites ? 1 : 0)

  const getThumbnailUrl = (videoId) => {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
  }

  return (
    <div
      className="relative min-h-screen overflow-x-hidden text-slate-100 selection:bg-amber-300 selection:text-slate-950"
      style={{ background: 'radial-gradient(160% 120% at 16% 0%, #3b2a17 0%, #12161f 42%, #070a10 100%)' }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.48), rgba(0,0,0,1))'
        }}
      />
      <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full blur-3xl" style={{ background: 'rgba(249,115,22,0.2)' }} />
      <div className="pointer-events-none absolute right-0 top-36 h-72 w-72 rounded-full blur-3xl" style={{ background: 'rgba(45,212,191,0.16)' }} />

      <motion.header
        className="sticky top-0 z-50 border-b backdrop-blur-2xl"
        style={{ borderColor: 'rgba(226,232,240,0.16)', background: 'linear-gradient(92deg, rgba(13,18,26,0.92) 0%, rgba(24,17,12,0.9) 52%, rgba(9,14,20,0.92) 100%)' }}
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => navigate('/dashboard')}
              className="group rounded-2xl border p-3"
              style={{ borderColor: 'rgba(148,163,184,0.35)', background: 'rgba(15,23,42,0.62)' }}
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft size={20} className="text-slate-100 transition-transform group-hover:-translate-x-1" />
            </motion.button>
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-amber-200/80">Movement Archive</p>
              <h1
                className="text-3xl leading-none tracking-tight text-white"
                style={{ fontFamily: "'Bebas Neue', 'Space Grotesk', sans-serif" }}
              >
                Exercise Library
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {searchTerm && (
              <motion.button
                onClick={getAIRecommendations}
                disabled={isLoadingAI}
                className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em]"
                style={{ borderColor: 'rgba(251,191,36,0.55)', background: 'rgba(217,119,6,0.2)', color: '#fde68a' }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                title="Get AI recommendations"
              >
                {isLoadingAI ? (
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Sparkles size={16} />
                  </motion.span>
                ) : (
                  <Sparkles size={16} />
                )}
                <span className="hidden md:inline">AI Picks</span>
              </motion.button>
            )}

            <motion.button
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              className="rounded-xl border p-2.5"
              style={{
                borderColor: showOnlyFavorites ? 'rgba(253,224,71,0.75)' : 'rgba(148,163,184,0.35)',
                background: showOnlyFavorites ? 'rgba(202,138,4,0.22)' : 'rgba(15,23,42,0.62)',
                color: showOnlyFavorites ? '#fde047' : '#cbd5e1'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={showOnlyFavorites ? 'Show all exercises' : 'Show favorite exercises only'}
            >
              <Star size={18} fill={showOnlyFavorites ? 'currentColor' : 'none'} />
            </motion.button>

            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className="rounded-xl border p-2.5"
              style={{ borderColor: 'rgba(251,191,36,0.5)', background: 'rgba(245,158,11,0.16)', color: '#fde68a' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Open filters"
            >
              <Filter size={18} />
            </motion.button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md sm:p-6"
            onClick={() => setShowFilters(false)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-[30px] border p-6 sm:p-8"
              style={{ borderColor: 'rgba(148,163,184,0.35)', background: 'linear-gradient(160deg, rgba(16,20,28,0.95) 0%, rgba(11,14,20,0.96) 100%)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pointer-events-none absolute -top-24 right-[-20px] h-52 w-52 rounded-full blur-3xl" style={{ background: 'rgba(245,158,11,0.18)' }} />
              <button onClick={() => setShowFilters(false)} className="absolute right-5 top-5 text-slate-400 transition-colors hover:text-white">
                <X size={22} />
              </button>

              <div className="relative z-10 space-y-8">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-amber-200">Refine Results</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Filter Protocols
                  </h2>
                </div>

                <div className="space-y-5">
                  <div>
                    <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">Difficulty</h3>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {allDifficulties.map(d => (
                        <button
                          key={d}
                          onClick={() => toggleDifficulty(d)}
                          className="rounded-xl border px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] transition-all"
                          style={{
                            borderColor: selectedDifficulty.includes(d) ? 'rgba(251,191,36,0.7)' : 'rgba(148,163,184,0.3)',
                            background: selectedDifficulty.includes(d) ? 'rgba(245,158,11,0.16)' : 'rgba(15,23,42,0.52)',
                            color: selectedDifficulty.includes(d) ? '#fde68a' : '#cbd5e1'
                          }}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">Equipment</h3>
                    <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                      {allEquipment.map(e => (
                        <button
                          key={e}
                          onClick={() => toggleEquipment(e)}
                          className="rounded-xl border px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] transition-all"
                          style={{
                            borderColor: selectedEquipment.includes(e) ? 'rgba(45,212,191,0.7)' : 'rgba(148,163,184,0.3)',
                            background: selectedEquipment.includes(e) ? 'rgba(15,118,110,0.22)' : 'rgba(15,23,42,0.52)',
                            color: selectedEquipment.includes(e) ? '#99f6e4' : '#cbd5e1'
                          }}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative mx-auto w-full max-w-7xl px-4 pb-14 pt-8 sm:px-6 lg:px-8">
        <motion.section
          className="relative overflow-hidden rounded-[30px] border p-6 sm:p-8"
          style={{ borderColor: 'rgba(148,163,184,0.35)', background: 'linear-gradient(145deg, rgba(14,19,28,0.9) 0%, rgba(8,11,16,0.92) 100%)' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full blur-3xl" style={{ background: 'rgba(245,158,11,0.18)' }} />
          <div className="pointer-events-none absolute -bottom-16 left-0 h-52 w-52 rounded-full blur-3xl" style={{ background: 'rgba(20,184,166,0.14)' }} />

          <div className="relative grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
            <div className="space-y-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-amber-200">Video-first movement catalog</p>
                <h2 className="mt-2 text-3xl font-semibold leading-tight text-white sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Curated tutorials with modern training clarity
                </h2>
              </div>

              <div className="relative max-w-3xl">
                <Search className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by movement, body part, or training goal"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-2xl border bg-slate-950/55 py-4 pl-14 pr-4 text-sm text-white outline-none transition-colors placeholder:text-slate-400/80 focus:border-cyan-300/80"
                  style={{ borderColor: 'rgba(148,163,184,0.35)' }}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: 'rgba(34,211,238,0.45)', background: 'rgba(34,211,238,0.12)', color: '#a5f3fc' }}>
                  {allExercises.length} total videos
                </span>
                <span className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: 'rgba(148,163,184,0.35)', background: 'rgba(30,41,59,0.5)', color: '#cbd5e1' }}>
                  {filteredExercises.length} showing
                </span>
                <span className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: 'rgba(253,224,71,0.45)', background: 'rgba(202,138,4,0.14)', color: '#fde68a' }}>
                  {favorites.length} favorites
                </span>
                {activeFilterCount > 0 && (
                  <span className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: 'rgba(45,212,191,0.55)', background: 'rgba(13,148,136,0.2)', color: '#99f6e4' }}>
                    {activeFilterCount} active filters
                  </span>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border p-4" style={{ borderColor: 'rgba(148,163,184,0.35)', background: 'rgba(15,23,42,0.62)' }}>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Category</p>
                <p className="mt-2 text-2xl font-semibold text-white">{categories.find((cat) => cat.id === selectedCategory)?.name || 'All'}</p>
              </div>
              <div className="rounded-2xl border p-4" style={{ borderColor: 'rgba(148,163,184,0.35)', background: 'rgba(15,23,42,0.62)' }}>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Difficulty Tags</p>
                <p className="mt-2 text-2xl font-semibold text-white">{selectedDifficulty.length || 'All'}</p>
              </div>
              <div className="rounded-2xl border p-4" style={{ borderColor: 'rgba(148,163,184,0.35)', background: 'rgba(15,23,42,0.62)' }}>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Equipment Tags</p>
                <p className="mt-2 text-2xl font-semibold text-white">{selectedEquipment.length || 'All'}</p>
              </div>
            </div>
          </div>
        </motion.section>

        <AnimatePresence>
          {showAIRecommendations && (
            <motion.section
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              className="relative mt-7 overflow-hidden rounded-[28px] border p-6"
              style={{ borderColor: 'rgba(251,191,36,0.42)', background: 'linear-gradient(150deg, rgba(120,53,15,0.34) 0%, rgba(26,34,48,0.62) 100%)' }}
            >
              <div className="pointer-events-none absolute -right-8 top-[-34px] h-40 w-40 rounded-full blur-3xl" style={{ background: 'rgba(245,158,11,0.25)' }} />

              <div className="relative mb-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="text-amber-200" size={24} />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-amber-200/85">Smart Suggestions</p>
                    <h3 className="text-2xl font-semibold text-white">AI Recommendations</h3>
                  </div>
                </div>
                <button onClick={() => setShowAIRecommendations(false)} className="text-slate-300 transition-colors hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {aiError ? (
                <p className="rounded-xl border border-rose-300/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">Could not generate recommendations right now. Try again in a moment.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {aiRecommendations.map((rec, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.08 }}
                      className="rounded-2xl border p-5"
                      style={{ borderColor: 'rgba(251,191,36,0.35)', background: 'rgba(15,23,42,0.62)' }}
                    >
                      <p className="text-xs uppercase tracking-[0.14em] text-amber-200">AI pick {index + 1}</p>
                      <h4 className="mt-2 text-xl font-semibold text-white">{rec.name}</h4>
                      <p className="mt-2 text-sm text-slate-300">{rec.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${getDifficultyColor(rec.difficulty)}`}>
                          {rec.difficulty}
                        </span>
                        <span className="rounded-full border border-slate-400/35 bg-slate-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-200">
                          {rec.equipment}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        <section className="mt-8 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Muscle Group Channels</p>
            {showOnlyFavorites && (
              <span className="rounded-full border border-yellow-400/45 bg-yellow-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-yellow-200">Favorites view</span>
            )}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat, idx) => {
              const accent = CATEGORY_ACCENTS[cat.color] || CATEGORY_ACCENTS.red
              const isActive = selectedCategory === cat.id && !showOnlyFavorites

              return (
                <motion.button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id)
                    setShowOnlyFavorites(false)
                  }}
                  className="flex shrink-0 items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-semibold tracking-[0.08em] transition-all"
                  style={{
                    borderColor: isActive ? accent.border : 'rgba(148,163,184,0.35)',
                    background: isActive ? accent.bg : 'rgba(15,23,42,0.55)',
                    boxShadow: isActive ? accent.shadow : 'none',
                    color: isActive ? accent.text : '#cbd5e1'
                  }}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <cat.icon size={16} strokeWidth={2.5} />
                  <span>{cat.name}</span>
                </motion.button>
              )
            })}
          </div>
        </section>

        {showOnlyFavorites && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3"
            style={{ borderColor: 'rgba(253,224,71,0.45)', background: 'rgba(202,138,4,0.12)' }}
          >
            <div className="flex items-center gap-2 text-yellow-100">
              <Star size={16} fill="currentColor" />
              <p className="text-sm font-semibold">Showing {filteredExercises.length} favorite exercises</p>
            </div>
            <button
              onClick={() => setShowOnlyFavorites(false)}
              className="rounded-lg border border-yellow-300/35 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-yellow-100 transition-colors hover:bg-yellow-400/10"
            >
              Show all
            </button>
          </motion.div>
        )}

        {isLoading ? (
          <div className="mt-8">
            <ExerciseSkeleton />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory + searchTerm + showOnlyFavorites}
              className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {filteredExercises.length > 0 ? (
                filteredExercises.map((ex, idx) => (
                  <motion.article
                    key={ex.id}
                    className="group relative overflow-hidden rounded-[28px] border p-[1px]"
                    style={{ borderColor: 'rgba(148,163,184,0.32)', background: 'linear-gradient(145deg, rgba(251,146,60,0.28), rgba(20,184,166,0.14), rgba(15,23,42,0.6))' }}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -6 }}
                  >
                    <div className="h-full rounded-[27px] border" style={{ borderColor: 'rgba(148,163,184,0.3)', background: 'linear-gradient(170deg, rgba(14,19,28,0.9) 0%, rgba(8,12,18,0.94) 100%)' }}>
                      <div className="relative aspect-[16/10] cursor-pointer overflow-hidden rounded-t-[26px]" onClick={() => setExpandedExercise(ex)}>
                        <img
                          src={getThumbnailUrl(ex.videoId)}
                          alt={ex.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/15 to-teal-400/8 opacity-80" />

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(ex.id)
                          }}
                          className="absolute left-4 top-4 z-20 rounded-full border p-2"
                          style={{ borderColor: 'rgba(148,163,184,0.42)', background: 'rgba(15,23,42,0.7)' }}
                        >
                          <Star size={15} className={isFavorite(ex.id) ? 'fill-yellow-400 text-yellow-300' : 'text-slate-300'} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            applyEquipmentTag(ex.equipment)
                          }}
                          className="absolute right-4 top-4 z-20 rounded-full border border-teal-200/35 bg-teal-300/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-teal-100"
                          title={`Filter by equipment: ${ex.equipment}`}
                        >
                          {ex.equipment}
                        </button>

                        <div className="absolute inset-0 z-10 flex items-center justify-center">
                          <div className="rounded-full border border-cyan-100/45 bg-slate-900/60 p-4 backdrop-blur-md transition-colors group-hover:bg-cyan-500/45">
                            <Play size={22} fill="currentColor" className="text-white" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-5 p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-2xl font-semibold leading-tight text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{ex.name}</h3>
                            <p className="mt-2 text-sm text-slate-300/85 line-clamp-2">{ex.description}</p>
                          </div>
                          <button
                            onClick={() => applyDifficultyTag(ex.difficulty)}
                            className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${getDifficultyColor(ex.difficulty)}`}
                            title={`Filter by difficulty: ${ex.difficulty}`}
                          >
                            {ex.difficulty}
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl border px-3 py-2" style={{ borderColor: 'rgba(148,163,184,0.3)', background: 'rgba(15,23,42,0.58)' }}>
                            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Target sets</p>
                            <p className="mt-1 text-lg font-semibold text-amber-100">{ex.sets}</p>
                          </div>
                          <div className="rounded-xl border px-3 py-2" style={{ borderColor: 'rgba(148,163,184,0.3)', background: 'rgba(15,23,42,0.58)' }}>
                            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Rep range</p>
                            <p className="mt-1 text-lg font-semibold text-teal-100">{ex.reps}</p>
                          </div>
                        </div>

                        {ex.substitutions && ex.substitutions.length > 0 && (
                          <div className="space-y-3">
                            <button
                              onClick={() => setShowSubstitutions(showSubstitutions === ex.id ? null : ex.id)}
                              className="w-full rounded-xl border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors"
                              style={{ borderColor: 'rgba(251,191,36,0.38)', background: showSubstitutions === ex.id ? 'rgba(245,158,11,0.16)' : 'rgba(15,23,42,0.52)', color: '#fcd34d' }}
                            >
                              <span className="inline-flex items-center gap-2">
                                <Repeat size={14} />
                                {showSubstitutions === ex.id ? 'Hide alternatives' : 'Show alternatives'}
                              </span>
                            </button>

                            <AnimatePresence>
                              {showSubstitutions === ex.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="space-y-2 border-t border-slate-500/30 pt-3">
                                    {getSubstitutions(ex).map(sub => (
                                      <button
                                        key={sub.id}
                                        onClick={() => {
                                          setExpandedExercise(sub)
                                          setShowSubstitutions(null)
                                        }}
                                        className="w-full rounded-xl border px-3 py-2 text-left transition-colors"
                                        style={{ borderColor: 'rgba(148,163,184,0.28)', background: 'rgba(15,23,42,0.5)' }}
                                      >
                                        <p className="text-sm font-semibold text-white">{sub.name}</p>
                                        <p className="mt-1 text-xs text-slate-400">{sub.equipment}</p>
                                      </button>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        <button
                          onClick={() => setExpandedExercise(ex)}
                          className="w-full rounded-xl border px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors"
                          style={{ borderColor: 'rgba(251,191,36,0.54)', background: 'linear-gradient(90deg, rgba(180,83,9,0.52), rgba(15,118,110,0.42))' }}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Play size={14} fill="currentColor" />
                            Watch tutorial
                          </span>
                        </button>
                      </div>
                    </div>
                  </motion.article>
                ))
              ) : (
                <div className="col-span-full">
                  <EmptyState
                    icon={Search}
                    title="No exercises matched"
                    message="Try a different keyword or clear active filters to broaden results."
                    action={{
                      label: 'Clear Filters',
                      onClick: () => {
                        setSearchTerm('')
                        setSelectedDifficulty([])
                        setSelectedEquipment([])
                        setShowOnlyFavorites(false)
                      }
                    }}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <AnimatePresence>
        {expandedExercise && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-xl sm:p-6"
            onClick={() => setExpandedExercise(null)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0, scale: 0.96 }}
              className="w-full max-w-4xl overflow-hidden rounded-[32px] border"
              style={{ borderColor: 'rgba(148,163,184,0.36)', background: 'linear-gradient(160deg, rgba(14,19,28,0.95) 0%, rgba(8,12,18,0.95) 100%)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-video bg-black">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${expandedExercise.videoId}?autoplay=1`}
                  title={expandedExercise.name}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>

                <button
                  onClick={() => setExpandedExercise(null)}
                  className="absolute right-4 top-4 rounded-full border p-2 text-white"
                  style={{ borderColor: 'rgba(148,163,184,0.5)', background: 'rgba(15,23,42,0.65)' }}
                >
                  <X size={20} />
                </button>

                <button
                  onClick={() => toggleFavorite(expandedExercise.id)}
                  className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm text-white"
                  style={{ borderColor: 'rgba(148,163,184,0.5)', background: 'rgba(15,23,42,0.65)' }}
                >
                  <Star size={16} className={isFavorite(expandedExercise.id) ? 'fill-yellow-400 text-yellow-300' : 'text-white'} />
                  <span>{isFavorite(expandedExercise.id) ? 'Favorited' : 'Add favorite'}</span>
                </button>
              </div>

              <div className="space-y-6 p-6 sm:p-8">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-amber-200">Exercise details</p>
                  <h2 className="mt-2 text-4xl font-semibold leading-tight text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{expandedExercise.name}</h2>
                  <p className="mt-3 text-slate-300">{expandedExercise.description}</p>
                </div>

                <div className="rounded-2xl border p-4" style={{ borderColor: 'rgba(251,191,36,0.4)', background: 'rgba(180,83,9,0.16)' }}>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-amber-200">Coach tip</p>
                  <p className="mt-2 text-slate-100">{expandedExercise.tips}</p>
                </div>

                {expandedExercise.substitutions && expandedExercise.substitutions.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-amber-200">Alternative exercises</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {getSubstitutions(expandedExercise).map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setExpandedExercise(sub)
                          }}
                          className="rounded-xl border px-4 py-3 text-left transition-colors hover:bg-amber-400/10"
                          style={{ borderColor: 'rgba(251,191,36,0.35)', background: 'rgba(15,23,42,0.55)' }}
                        >
                          <p className="font-semibold text-white">{sub.name}</p>
                          <p className="mt-1 text-xs text-slate-400">{sub.equipment}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  className="w-full rounded-xl border border-amber-300/50 bg-amber-300/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-100 transition-colors hover:bg-amber-300/20"
                  onClick={() => setExpandedExercise(null)}
                >
                  Close player
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ExerciseLibrary