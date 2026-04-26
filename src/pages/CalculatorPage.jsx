import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calculator,
  Flame,
  Gauge,
  History,
  Target,
  TrendingUp,
  Activity,
  BadgeCheck,
} from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  calculateBMI,
  getBMICategory,
  calculateBMR,
  calculateTDEE,
  calculateCalorieGoals,
  calculateMacros,
  calculateIdealWeightRange,
} from '../utils/Calculations'
import { saveCalculation, getCalculations } from '../services/api'

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'active', label: 'Active' },
  { value: 'veryActive', label: 'Very Active' },
]

const GOAL_OPTIONS = [
  { value: 'lose', label: 'Weight Loss' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'gain', label: 'Muscle Gain' },
]

const DEFAULT_FORM = {
  weight: '',
  height: '',
  age: '',
  gender: 'male',
  activityLevel: 'moderate',
  goal: 'maintain',
}

const CALC_COLORS = {
  page: 'linear-gradient(120deg, #0b0f14 0%, #0f141b 35%, #121821 70%, #0b0f14 100%)',
  accent: '#d1d5db',
  signal: '#ef4444',
}

const MATTE = {
  panel: 'linear-gradient(155deg, rgba(255,255,255,0.08) 0%, rgba(26,32,44,0.92) 30%, rgba(9,12,18,0.98) 100%)',
  tile: 'linear-gradient(150deg, rgba(255,255,255,0.07) 0%, rgba(16,22,33,0.95) 45%, rgba(6,9,14,1) 100%)',
  inset: 'linear-gradient(170deg, rgba(255,255,255,0.03) 0%, rgba(20,26,34,0.95) 36%, rgba(11,15,21,1) 100%)',
  border: 'rgba(255,255,255,0.18)',
  borderSoft: 'rgba(255,255,255,0.10)',
}

const getToken = () => {
  const t = localStorage.getItem('token')
  return t && t !== 'null' && t !== 'undefined' && t !== 'demo-token-skip-auth' ? t : null
}

const normalizeActivityLevel = (value = '') => {
  const v = String(value).toLowerCase()
  if (v.includes('very')) return 'veryActive'
  if (v.includes('active')) return 'active'
  if (v.includes('light')) return 'light'
  if (v.includes('sedentary')) return 'sedentary'
  return 'moderate'
}

const normalizeGoal = (value = '') => {
  const v = String(value).toLowerCase()
  if (v.includes('loss')) return 'lose'
  if (v.includes('gain') || v.includes('muscle') || v.includes('strength')) return 'gain'
  return 'maintain'
}

const toProfileGoal = (goal) => {
  if (goal === 'lose') return 'Weight Loss'
  if (goal === 'gain') return 'Muscle Building'
  return 'General Fitness'
}

const InputLabel = ({ children }) => (
  <label className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-2 block" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
    {children}
  </label>
)

const SectionLabel = ({ icon: Icon, title, accent }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accent}20`, border: `1px solid ${accent}66` }}>
      <Icon size={15} style={{ color: accent }} />
    </div>
    <p className="text-xs font-black uppercase tracking-[0.28em] text-zinc-300" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
      {title}
    </p>
  </div>
)

function CalculatorPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ ...DEFAULT_FORM })
  const [results, setResults] = useState(null)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    try {
      const savedProfileRaw = localStorage.getItem('userProfile')
      const savedCalcRaw = localStorage.getItem('calculatorLastResult')

      if (savedProfileRaw) {
        const profile = JSON.parse(savedProfileRaw)
        setFormData((prev) => ({
          ...prev,
          weight: profile.currentWeight ? String(profile.currentWeight) : prev.weight,
          height: profile.height ? String(profile.height) : prev.height,
          age: profile.age ? String(profile.age) : prev.age,
          gender: String(profile.gender || 'male').toLowerCase() === 'female' ? 'female' : 'male',
          activityLevel: normalizeActivityLevel(profile.activityLevel),
          goal: normalizeGoal(profile.fitnessGoal),
        }))
      }

      if (savedCalcRaw) {
        const parsed = JSON.parse(savedCalcRaw)
        if (parsed && parsed.bmi && parsed.calorieGoal) {
          setResults(parsed)
        }
      }
    } catch {
      toast.error('Could not load your saved calculator data.')
    }
  }, [])

  useEffect(() => {
    const token = getToken()
    if (!token) return

    const loadHistory = async () => {
      setLoadingHistory(true)
      try {
        const data = await getCalculations()
        const latest = Array.isArray(data) ? data.slice(0, 6) : []
        setHistory(latest)
      } catch {
        setHistory([])
      } finally {
        setLoadingHistory(false)
      }
    }

    loadHistory()
  }, [])

  const isFormComplete = useMemo(() => {
    return !!formData.weight && !!formData.height && !!formData.age
  }, [formData])

  const macroBars = useMemo(() => {
    if (!results?.macros || !results?.calorieGoal?.calories) return []
    const calories = Number(results.calorieGoal.calories) || 1
    const macroCalories = {
      Protein: (Number(results.macros.protein) || 0) * 4,
      Carbs: (Number(results.macros.carbs) || 0) * 4,
      Fats: (Number(results.macros.fats) || 0) * 9,
    }

    return [
      { label: 'Protein', grams: Number(results.macros.protein) || 0, pct: Math.round((macroCalories.Protein / calories) * 100), color: '#a3a3a3' },
      { label: 'Carbs', grams: Number(results.macros.carbs) || 0, pct: Math.round((macroCalories.Carbs / calories) * 100), color: CALC_COLORS.accent },
      { label: 'Fats', grams: Number(results.macros.fats) || 0, pct: Math.round((macroCalories.Fats / calories) * 100), color: '#f59e0b' },
    ]
  }, [results])

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const validateInputs = () => {
    const weight = Number(formData.weight)
    const height = Number(formData.height)
    const age = Number(formData.age)

    if (!Number.isFinite(weight) || weight < 25 || weight > 350) return 'Enter a valid weight between 25 and 350 kg.'
    if (!Number.isFinite(height) || height < 120 || height > 240) return 'Enter a valid height between 120 and 240 cm.'
    if (!Number.isFinite(age) || age < 13 || age > 100) return 'Enter a valid age between 13 and 100 years.'
    return null
  }

  const handleCalculate = async (e) => {
    e.preventDefault()

    const validationMessage = validateInputs()
    if (validationMessage) {
      toast.error(validationMessage)
      return
    }

    const weight = parseFloat(formData.weight)
    const height = parseFloat(formData.height)
    const age = parseInt(formData.age, 10)

    setSubmitting(true)
    try {
      const bmi = calculateBMI(weight, height)
      const bmiCategory = getBMICategory(parseFloat(bmi))
      const bmr = calculateBMR(weight, height, age, formData.gender)
      const tdee = calculateTDEE(bmr, formData.activityLevel)
      const calorieGoal = calculateCalorieGoals(tdee, formData.goal)
      const macros = calculateMacros(calorieGoal.calories, formData.goal)
      const healthyRange = calculateIdealWeightRange(height)

      const newResults = {
        bmi,
        bmiCategory,
        bmr: Math.round(bmr),
        tdee,
        calorieGoal,
        macros,
        healthyRange,
        calculatedAt: new Date().toISOString(),
      }

      setResults(newResults)
      localStorage.setItem('calculatorLastResult', JSON.stringify(newResults))

      localStorage.setItem(
        'userCalorieData',
        JSON.stringify({
          tdee,
          maintenanceCalories: tdee,
          goalCalories: calorieGoal.calories,
          goalType: formData.goal,
          protein: macros.protein,
          carbs: macros.carbs,
          fats: macros.fats,
          bmi,
          bmr: Math.round(bmr),
        })
      )

      try {
        const profileRaw = localStorage.getItem('userProfile')
        const profile = profileRaw ? JSON.parse(profileRaw) : {}
        const updatedProfile = {
          ...profile,
          currentWeight: String(formData.weight),
          height: String(formData.height),
          age: String(formData.age),
          gender: formData.gender === 'female' ? 'Female' : 'Male',
          activityLevel: ACTIVITY_OPTIONS.find((o) => o.value === formData.activityLevel)?.label || 'Moderate',
          fitnessGoal: toProfileGoal(formData.goal),
        }
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile))
      } catch {
        // Non-blocking local profile sync
      }

      if (getToken()) {
        const payload = {
          calculationType: 'TDEE',
          inputs: {
            ...formData,
            weight,
            height,
            age,
          },
          results: newResults,
        }

        try {
          await saveCalculation(payload)
          const data = await getCalculations()
          setHistory(Array.isArray(data) ? data.slice(0, 6) : [])
        } catch {
          toast.error('Calculated successfully, but failed to sync history to server.')
        }
      }

      toast.success('Calculator updated and synced.')
    } finally {
      setSubmitting(false)
    }
  }

  const applyHistoryItem = (item) => {
    if (!item?.inputs || !item?.results) return
    setFormData((prev) => ({
      ...prev,
      weight: String(item.inputs.weight || prev.weight || ''),
      height: String(item.inputs.height || prev.height || ''),
      age: String(item.inputs.age || prev.age || ''),
      gender: item.inputs.gender || prev.gender,
      activityLevel: item.inputs.activityLevel || prev.activityLevel,
      goal: item.inputs.goal || prev.goal,
    }))
    setResults(item.results)
    toast.success('Loaded calculation from history.')
  }

  return (
    <div className="min-h-screen text-zinc-100 relative overflow-x-hidden" style={{ background: CALC_COLORS.page }}>
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 20% 10%, rgba(255,255,255,0.09), transparent 40%), radial-gradient(circle at 85% 85%, rgba(239,68,68,0.10), transparent 50%)' }} />

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
            <h1 className="text-lg md:text-2xl font-black uppercase tracking-[0.1em]" style={{ color: CALC_COLORS.accent }}>Fitness Calculator</h1>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${MATTE.borderSoft}` }}>
          <BadgeCheck size={15} style={{ color: CALC_COLORS.signal }} />
          <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: CALC_COLORS.accent, fontFamily: 'JetBrains Mono, monospace' }}>
            Diet Sync Enabled
          </span>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 grid xl:grid-cols-12 gap-6 relative z-10">
        <motion.section
          className="xl:col-span-4 rounded-2xl p-5 md:p-6"
          style={{ background: MATTE.panel, border: `1px solid ${MATTE.borderSoft}` }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <SectionLabel icon={Calculator} title="Input Forge" accent={CALC_COLORS.accent} />

          <form onSubmit={handleCalculate} className="space-y-4">
            {[{ label: 'Weight (kg)', name: 'weight' }, { label: 'Height (cm)', name: 'height' }, { label: 'Age (years)', name: 'age' }].map((field) => (
              <div key={field.name}>
                <InputLabel>{field.label}</InputLabel>
                <input
                  type="number"
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  placeholder="Enter value"
                  className="w-full rounded-xl px-3 py-3 bg-black/40 border border-white/10 focus:outline-none text-zinc-100"
                />
              </div>
            ))}

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <InputLabel>Gender</InputLabel>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full rounded-xl px-3 py-3 bg-black/40 border border-white/10 focus:outline-none text-zinc-100"
                >
                  <option value="male" className="bg-zinc-900">Male</option>
                  <option value="female" className="bg-zinc-900">Female</option>
                </select>
              </div>
              <div>
                <InputLabel>Goal</InputLabel>
                <select
                  name="goal"
                  value={formData.goal}
                  onChange={handleChange}
                  className="w-full rounded-xl px-3 py-3 bg-black/40 border border-white/10 focus:outline-none text-zinc-100"
                >
                  {GOAL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-zinc-900">{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <InputLabel>Activity Level</InputLabel>
              <select
                name="activityLevel"
                value={formData.activityLevel}
                onChange={handleChange}
                className="w-full rounded-xl px-3 py-3 bg-black/40 border border-white/10 focus:outline-none text-zinc-100"
              >
                {ACTIVITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-zinc-900">{opt.label}</option>
                ))}
              </select>
            </div>

            <motion.button
              type="submit"
              disabled={!isFormComplete || submitting}
              className="w-full py-3.5 rounded-xl text-black font-black uppercase tracking-[0.16em] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: `linear-gradient(120deg, ${CALC_COLORS.accent} 0%, #f3f4f6 100%)` }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <Gauge size={17} />
              {submitting ? 'Computing...' : 'Compute Plan'}
            </motion.button>
          </form>
        </motion.section>

        <section className="xl:col-span-8 space-y-6">
          {results ? (
            <>
              <motion.div
                className="rounded-2xl p-5 md:p-6"
                style={{ background: MATTE.panel, border: `1px solid ${MATTE.borderSoft}` }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <SectionLabel icon={Flame} title="Output Summary" accent={CALC_COLORS.accent} />

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="rounded-xl p-4" style={{ background: MATTE.tile, border: `1px solid ${MATTE.borderSoft}` }}>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>BMI</p>
                    <p className="text-4xl mt-2 font-black" style={{ color: results.bmiCategory?.color ? undefined : CALC_COLORS.accent }}>{results.bmi}</p>
                    <p className={`mt-1 text-xs font-bold uppercase tracking-[0.15em] ${results.bmiCategory.color}`}>{results.bmiCategory.category}</p>
                  </div>

                  <div className="rounded-xl p-4" style={{ background: MATTE.tile, border: `1px solid ${MATTE.borderSoft}` }}>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Daily Calories</p>
                    <p className="text-4xl mt-2 font-black text-zinc-100">{results.calorieGoal.calories}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.15em] text-zinc-400">{results.calorieGoal.description}</p>
                  </div>

                  <div className="rounded-xl p-4" style={{ background: MATTE.tile, border: `1px solid ${MATTE.borderSoft}` }}>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Energy Model</p>
                    <p className="mt-2 text-sm text-zinc-300">BMR: <span className="text-zinc-100 font-bold">{results.bmr}</span></p>
                    <p className="text-sm text-zinc-300">TDEE: <span className="text-zinc-100 font-bold">{results.tdee}</span></p>
                    <p className="mt-2 text-xs text-zinc-500">Healthy range: {results.healthyRange?.min} to {results.healthyRange?.max} kg</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="rounded-2xl p-5 md:p-6"
                style={{ background: MATTE.panel, border: `1px solid ${MATTE.borderSoft}` }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <SectionLabel icon={Activity} title="Macro Distribution" accent={CALC_COLORS.accent} />

                <div className="space-y-3">
                  {macroBars.map((macro) => (
                    <div key={macro.label} className="rounded-xl p-3" style={{ background: MATTE.inset, border: `1px solid ${MATTE.borderSoft}` }}>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <p className="text-zinc-300 font-semibold">{macro.label}</p>
                        <p className="text-zinc-100 font-black">{macro.grams} g</p>
                      </div>
                      <div className="h-2 rounded-full bg-black/50 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.max(5, macro.pct)}%`, background: macro.color }} />
                      </div>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-zinc-500">{macro.pct}% of daily calories</p>
                    </div>
                  ))}
                </div>

                <motion.button
                  onClick={() => navigate('/diet')}
                  className="mt-4 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.14em]"
                  style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${MATTE.borderSoft}`, color: CALC_COLORS.accent }}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Send Targets To Diet Tracker
                </motion.button>
              </motion.div>

              <motion.div
                className="rounded-2xl p-5 md:p-6"
                style={{ background: MATTE.panel, border: `1px solid ${MATTE.borderSoft}` }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <SectionLabel icon={History} title="Recent Calculations" accent={CALC_COLORS.accent} />

                {loadingHistory ? (
                  <p className="text-zinc-500 text-sm">Loading history...</p>
                ) : history.length === 0 ? (
                  <p className="text-zinc-500 text-sm">No server history yet. Calculate once while logged in to store history.</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((item) => {
                      const calories = item?.results?.calorieGoal?.calories || '--'
                      const bmi = item?.results?.bmi || '--'
                      const created = item?.createdAt ? new Date(item.createdAt) : null

                      return (
                        <button
                          key={item._id}
                          onClick={() => applyHistoryItem(item)}
                          className="w-full text-left rounded-xl px-3 py-3 transition-colors"
                          style={{ background: MATTE.inset, border: `1px solid ${MATTE.borderSoft}` }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-zinc-100 font-semibold">{calories} kcal/day</p>
                              <p className="text-zinc-500 text-xs uppercase tracking-[0.12em]">BMI {bmi}</p>
                            </div>
                            <p className="text-zinc-500 text-xs">{created ? created.toLocaleDateString() : 'Unknown date'}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            </>
          ) : (
            <motion.div
              className="rounded-2xl p-10 h-full flex items-center justify-center"
              style={{ background: MATTE.panel, border: `1px solid ${MATTE.borderSoft}` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-center max-w-md">
                <Target className="mx-auto mb-4" size={58} style={{ color: '#9ca3af' }} />
                <p className="text-zinc-200 text-lg font-black uppercase tracking-[0.14em]">Build your nutrition blueprint</p>
                <p className="text-zinc-500 text-sm mt-2">Enter your stats and we will compute BMI, calories, and macros with server-backed history.</p>
              </div>
            </motion.div>
          )}
        </section>
      </main>
    </div>
  )
}

export default CalculatorPage
