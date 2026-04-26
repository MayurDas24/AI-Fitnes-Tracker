import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Plus, Trash2, Radio, BarChart3, Flame, Database, Activity,
  Sparkles, ChefHat, X, RefreshCw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, ReferenceLine 
} from 'recharts'
import { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import { DietSkeleton } from '../components/LoadingSkeleton'
import { EmptyState } from '../components/EmptyState'
import { useApi, apiPost, apiDelete } from '../hooks/useApi'

const UI_THEME_KEY = 'uiColorTheme'
const UI_THEMES = {
  ice: { page: 'linear-gradient(120deg, #0a0f1f 0%, #0f172a 35%, #111827 65%, #0b1020 100%)', accent: '#7dd3fc' },
  copper: { page: 'linear-gradient(120deg, #1b110a 0%, #2a170f 38%, #3a1d12 70%, #1b110a 100%)', accent: '#fb923c' },
  mint: { page: 'linear-gradient(120deg, #041612 0%, #06261f 35%, #0c342a 70%, #041612 100%)', accent: '#2dd4bf' },
  crimson: { page: 'linear-gradient(120deg, #1a0b13 0%, #2b0f1d 35%, #3a1228 70%, #1a0b13 100%)', accent: '#fb7185' },
}

const MATTE = {
  panel: 'linear-gradient(155deg, rgba(255,255,255,0.08) 0%, rgba(26,32,44,0.92) 30%, rgba(9,12,18,0.98) 100%)',
  tile: 'linear-gradient(150deg, rgba(255,255,255,0.07) 0%, rgba(16,22,33,0.95) 45%, rgba(6,9,14,1) 100%)',
  border: 'rgba(255,255,255,0.18)',
  borderSoft: 'rgba(255,255,255,0.12)',
}

const AI_MEAL_LIMIT = 20

// Custom cyberpunk tooltip
const CustomTooltip = ({ active, payload, label, calorieGoal, accent }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl p-4 backdrop-blur-sm" style={{ background: 'rgba(5,7,10,0.94)', border: `1px solid ${MATTE.borderSoft}` }}>
      <p className="font-bold text-sm mb-2" style={{ color: accent }}>{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: accent }} />
          <span className="text-xs text-gray-300">Calories:</span>
          <span className="font-bold" style={{ color: accent }}>{payload[0]?.value?.toLocaleString() || 0} kcal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
          <span className="text-xs text-gray-300">Protein:</span>
          <span className="font-bold text-amber-300">{payload[1]?.value || 0}g</span>
        </div>
      </div>
      <div className="mt-2 px-2 py-1 rounded text-[10px] font-bold" style={{ color: accent, background: 'rgba(255,255,255,0.04)' }}>
        TARGET: {Number(calorieGoal || 2500).toLocaleString()} kcal
      </div>
    </div>
  )
}

function DietTracker() {
  const navigate = useNavigate()
  const { data: apiMeals, loading: mealsLoading, refetch: refetchMeals } = useApi('/meals')
  const [themeName] = useState(() => localStorage.getItem(UI_THEME_KEY) || 'mint')
  const theme = UI_THEMES[themeName] || UI_THEMES.mint
  const [isLoading, setIsLoading] = useState(true)
  
  // Load nutrition goals from Calculator
  const [nutritionGoals] = useState(() => {
    const saved = localStorage.getItem('userCalorieData')
    const profile = JSON.parse(localStorage.getItem('userProfile') || '{}')
    
    if (saved) {
      try {
        const data = JSON.parse(saved)
        return {
          calories: data.goalCalories || data.maintenanceCalories || 2500,
          protein: data.protein || Math.round((profile.currentWeight || 70) * 2.2),
          carbs: data.carbs || 250,
          fats: data.fats || 83
        }
      } catch (e) {
        console.error('Failed to parse calorie data:', e)
      }
    }
    
    // Fallback based on weight if available
    const weight = profile.currentWeight || 70
    return {
      calories: 2500,
      protein: Math.round(weight * 2.2),
      carbs: 250,
      fats: 83
    }
  })

  const CALORIE_GOAL = nutritionGoals.calories
  const PROTEIN_GOAL = nutritionGoals.protein

  const [localTodayLog, setLocalTodayLog] = useState(() => {
    const saved = localStorage.getItem('todayLog')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (error) {
        console.error('Failed to load today log:', error)
        return []
      }
    }
    return []
  })

  useEffect(() => {
    localStorage.setItem('todayLog', JSON.stringify(localTodayLog))
  }, [localTodayLog])

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000)
  }, [])

  const todayStr = new Date().toISOString().split('T')[0]
  const meals = useMemo(() => (Array.isArray(apiMeals) ? apiMeals : []), [apiMeals])

  const todayApiLog = useMemo(() => {
    return meals.filter((m) => m.date === todayStr)
  }, [meals, todayStr])

  const todayLog = useMemo(() => {
    const apiMapped = todayApiLog.map((m) => ({
      id: m._id,
      _id: m._id,
      name: m.name,
      calories: Number(m.calories) || 0,
      protein: Number(m.protein) || 0,
      carbs: Number(m.carbs) || 0,
      fats: Number(m.fat) || 0,
      time: new Date(m.createdAt || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: m.date,
      createdAt: m.createdAt || new Date().toISOString(),
      source: 'api',
    }))

    const localMapped = (localTodayLog || [])
      .filter((m) => (m.date || todayStr) === todayStr)
      .map((m) => ({
        ...m,
        calories: Number(m.calories) || 0,
        protein: Number(m.protein) || 0,
        date: m.date || todayStr,
        createdAt: m.createdAt || new Date().toISOString(),
        source: 'local',
      }))

    return [...apiMapped, ...localMapped].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    )
  }, [todayApiLog, localTodayLog, todayStr])

  useEffect(() => {
    if (!localTodayLog.length) return

    let disposed = false
    let syncing = false

    const syncPendingMeals = async () => {
      if (syncing || disposed) return
      syncing = true

      const queue = [...localTodayLog]
      const remaining = []
      let syncedCount = 0

      for (const m of queue) {
        if (disposed) break
        const saved = await apiPost('/meals', {
          date: m.date || todayStr,
          name: m.name,
          calories: Number(m.calories) || 0,
          protein: Number(m.protein) || 0,
          carbs: Number(m.carbs) || 0,
          fat: Number(m.fat) || 0,
          mealType: m.mealType || 'snack',
        })

        if (saved) {
          syncedCount += 1
        } else {
          remaining.push(m)
        }
      }

      if (!disposed && syncedCount > 0) {
        setLocalTodayLog(remaining)
        await refetchMeals()
        toast.success(`Synced ${syncedCount} offline meal${syncedCount > 1 ? 's' : ''}`)
      }

      syncing = false
    }

    syncPendingMeals()
    const intervalId = setInterval(syncPendingMeals, 12000)

    return () => {
      disposed = true
      clearInterval(intervalId)
    }
  }, [localTodayLog, todayStr, refetchMeals])

  const historyData = useMemo(() => {
    const byDate = {}

    meals.forEach((m) => {
      const d = m.date
      if (!d) return
      if (!byDate[d]) byDate[d] = { cals: 0, pro: 0 }
      byDate[d].cals += Number(m.calories) || 0
      byDate[d].pro += Number(m.protein) || 0
    })

    if (todayApiLog.length === 0 && localTodayLog.length > 0) {
      byDate[todayStr] = {
        cals: localTodayLog.reduce((sum, m) => sum + (Number(m.calories) || 0), 0),
        pro: localTodayLog.reduce((sum, m) => sum + (Number(m.protein) || 0), 0),
      }
    }

    const rows = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      rows.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        cals: byDate[key]?.cals || 0,
        pro: byDate[key]?.pro || 0,
      })
    }
    return rows
  }, [meals, localTodayLog, todayApiLog.length, todayStr])

  const [entry, setEntry] = useState({ name: '', calories: '', protein: '' })
  const [showAISuggestions, setShowAISuggestions] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState([])
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [aiError, setAiError] = useState(false)
  const [aiRefineInput, setAiRefineInput] = useState('')
  const [aiContext, setAiContext] = useState({ goal: 'maintain', mealType: 'meal' })
  const [expandedSuggestionIndex, setExpandedSuggestionIndex] = useState(null)

  const totals = useMemo(() => {
    return todayLog.reduce((acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein
    }), { calories: 0, protein: 0 })
  }, [todayLog])

  const calProgress = Math.min((totals.calories / CALORIE_GOAL) * 100, 100)
  const proProgress = Math.min((totals.protein / PROTEIN_GOAL) * 100, 100)

  const getGoalAndMealType = () => {
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}')
    const fitnessGoal = String(userProfile.fitnessGoal || '').toLowerCase()

    let userGoal = 'maintain'
    if (fitnessGoal.includes('loss') || fitnessGoal.includes('weight')) {
      userGoal = 'weight_loss'
    } else if (fitnessGoal.includes('gain') || fitnessGoal.includes('muscle') || fitnessGoal.includes('strength')) {
      userGoal = 'muscle_gain'
    }

    const hour = new Date().getHours()
    let mealType = 'meal'
    if (hour < 11) mealType = 'breakfast'
    else if (hour < 15) mealType = 'lunch'
    else if (hour < 19) mealType = 'dinner'
    else mealType = 'snack'

    return { userGoal, mealType }
  }

  const normalizeAIMeals = (raw) => {
    const arr = Array.isArray(raw) ? raw : []
    return arr
      .map((item) => ({
        name: String(item?.name || '').trim(),
        calories: Number(item?.calories) || 0,
        protein: Number(item?.protein) || 0,
        description: String(item?.description || 'AI suggested meal option').trim(),
        instructions: Array.isArray(item?.instructions)
          ? item.instructions.filter(Boolean).map((s) => String(s).trim()).filter(Boolean)
          : String(item?.instructions || '')
              .split(/\n|\.|\d+\)/)
              .map((s) => s.trim())
              .filter(Boolean)
              .slice(0, 8),
      }))
      .filter((item) => item.name && item.calories > 0)
      .slice(0, AI_MEAL_LIMIT)
  }

  const getAIMealSuggestions = async (customRequest = '') => {
    setIsLoadingAI(true)
    setAiError(false)

    const { userGoal, mealType } = getGoalAndMealType()
    setAiContext({ goal: userGoal, mealType })

    const remainingCalories = Math.max(CALORIE_GOAL - totals.calories, 0)
    const remainingProtein = Math.max(PROTEIN_GOAL - totals.protein, 0)
    const previousNames = aiSuggestions.map((item) => item.name).filter(Boolean).join(', ')

    const goalInstruction = userGoal === 'weight_loss'
      ? 'Prioritize low-calorie, high-satiety meals with lean protein and fiber-rich foods.'
      : userGoal === 'muscle_gain'
        ? 'Prioritize high-protein meals with quality carbs to support training performance and recovery.'
        : 'Provide balanced meals with moderate calories and good macro quality.'

    const userConstraintBlock = customRequest
      ? `User requested custom preference: ${customRequest}`
      : 'No extra preference provided.'

    const excludeBlock = previousNames
      ? `Avoid repeating these previously suggested foods: ${previousNames}`
      : 'No previous suggestions to avoid.'

    const prompt = `Create ${AI_MEAL_LIMIT} different ${mealType} food options for a user with goal ${userGoal.replace('_', ' ')}.

Daily targets remaining:
- calories left: ${Math.round(remainingCalories)}
- protein left: ${Math.round(remainingProtein)}

${goalInstruction}
${userConstraintBlock}
${excludeBlock}

Return ONLY valid JSON array with this shape:
[
  {
    "name": "Meal Name",
    "calories": 430,
    "protein": 32,
    "description": "short ingredients and why this fits goal",
    "instructions": ["Step 1", "Step 2", "Step 3", "Step 4"]
  }
]

Rules:
- Give diverse options across chicken, fish, eggs, dairy, tofu, legumes, grains, wraps, salads, bowls, smoothies where relevant.
- Keep realistic calories and protein values.
- Do not include markdown, comments, or extra text.`

    try {
      const aiResponse = await apiPost('/ai/chat', {
        model: 'llama-3.3-70b-versatile',
        temperature: 0.75,
        max_tokens: 3200,
        messages: [
          {
            role: 'system',
            content: 'You are a nutrition recommendation assistant. Always return strict JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      const content = aiResponse?.choices?.[0]?.message?.content
      if (!content) throw new Error('Empty AI response')

      const jsonMatch = String(content).match(/\[[\s\S]*\]/)
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content)
      const normalized = normalizeAIMeals(parsed)

      if (!normalized.length) {
        throw new Error('No valid meal suggestions from AI')
      }

      setAiSuggestions(normalized)
      setExpandedSuggestionIndex(null)
      setShowAISuggestions(true)
    } catch (error) {
      console.error('AI suggestion failed:', error)
      setAiError(true)
      const fallbackSuggestions = getSmartFallbackMeals(userGoal, mealType, remainingCalories, remainingProtein)
      setAiSuggestions(fallbackSuggestions)
      setExpandedSuggestionIndex(null)
      setShowAISuggestions(true)
    } finally {
      setIsLoadingAI(false)
    }
  }

  // Smart fallback meals based on goal
  const getSmartFallbackMeals = (goal, mealType, remainingCals, remainingProtein) => {
    const maxCal = Math.min(remainingCals, 700)
    
    if (goal === 'weight_loss') {
      return [
        { 
          name: 'Lean Protein Salad', 
          calories: Math.min(350, maxCal), 
          protein: Math.min(30, remainingProtein), 
          description: 'Grilled chicken breast on mixed greens with cucumber, tomatoes, and light vinaigrette' 
          ,instructions: ['Season chicken with salt and pepper', 'Grill chicken 5-6 min per side', 'Chop greens and vegetables', 'Slice chicken and toss with salad and vinaigrette']
        },
        { 
          name: 'Vegetable Stir-fry', 
          calories: Math.min(300, maxCal), 
          protein: Math.min(20, remainingProtein), 
          description: 'Mixed vegetables with tofu or shrimp in light soy sauce, served with a small portion of brown rice',
          instructions: ['Heat pan with a little oil', 'Stir-fry tofu or shrimp for 3-4 minutes', 'Add mixed vegetables and cook until crisp-tender', 'Add soy sauce and serve with brown rice']
        },
        { 
          name: 'Greek Yogurt Bowl', 
          calories: Math.min(250, maxCal), 
          protein: Math.min(25, remainingProtein), 
          description: 'Non-fat Greek yogurt with fresh berries and a sprinkle of almonds',
          instructions: ['Add Greek yogurt to a bowl', 'Top with mixed berries', 'Sprinkle chopped almonds', 'Serve chilled']
        },
        { name: 'Egg White Scramble', calories: Math.min(280, maxCal), protein: Math.min(26, remainingProtein), description: 'Egg whites with spinach and tomatoes', instructions: ['Whisk egg whites with seasoning', 'Saute spinach and tomatoes for 2 minutes', 'Add egg whites and scramble until set', 'Serve immediately'] },
        { name: 'Tofu Veggie Bowl', calories: Math.min(320, maxCal), protein: Math.min(24, remainingProtein), description: 'Tofu, peppers, broccoli, and light sauce', instructions: ['Press and cube tofu', 'Pan-sear tofu until golden', 'Steam or stir-fry vegetables', 'Mix with light sauce and serve'] },
        { name: 'Shrimp Zucchini Stir-fry', calories: Math.min(300, maxCal), protein: Math.min(28, remainingProtein), description: 'Shrimp with zucchini noodles and garlic', instructions: ['Saute garlic in a hot pan', 'Cook shrimp 2-3 minutes until pink', 'Add zucchini noodles and toss 1-2 minutes', 'Season and plate'] },
        { name: 'Turkey Cucumber Wrap', calories: Math.min(290, maxCal), protein: Math.min(27, remainingProtein), description: 'Lean turkey wrapped with crunchy vegetables', instructions: ['Lay out wrap or lettuce leaves', 'Add sliced turkey and cucumber', 'Add sauce or mustard', 'Roll tightly and cut'] },
        { name: 'Lentil Soup + Salad', calories: Math.min(330, maxCal), protein: Math.min(22, remainingProtein), description: 'Fiber-rich lentils with fresh greens', instructions: ['Simmer lentils with onions and spices', 'Cook until lentils are tender', 'Prepare side salad', 'Serve soup hot with salad'] }
      ]
    } else if (goal === 'muscle_gain') {
      return [
        { 
          name: 'Chicken & Rice Bowl', 
          calories: Math.min(600, maxCal), 
          protein: Math.min(45, remainingProtein), 
          description: 'Grilled chicken breast with brown rice, steamed broccoli, and avocado',
          instructions: ['Cook rice until fluffy', 'Season and grill chicken breast', 'Steam broccoli until bright green', 'Assemble bowl and top with avocado']
        },
        { 
          name: 'Protein Pasta', 
          calories: Math.min(550, maxCal), 
          protein: Math.min(35, remainingProtein), 
          description: 'Whole wheat pasta with lean ground turkey, marinara sauce, and Parmesan',
          instructions: ['Boil whole wheat pasta', 'Cook turkey in skillet until browned', 'Add marinara and simmer 5 minutes', 'Combine pasta and sauce, top with Parmesan']
        },
        { 
          name: 'Post-Workout Shake', 
          calories: Math.min(400, maxCal), 
          protein: Math.min(40, remainingProtein), 
          description: 'Whey protein, banana, peanut butter, and oats blended with milk',
          instructions: ['Add milk to blender', 'Add whey, banana, oats, and peanut butter', 'Blend until smooth', 'Drink fresh']
        },
        { name: 'Beef Burrito Bowl', calories: Math.min(640, maxCal), protein: Math.min(42, remainingProtein), description: 'Lean beef, rice, beans, salsa, and avocado', instructions: ['Cook rice and warm beans', 'Saute lean beef with spices', 'Layer rice, beans, and beef in bowl', 'Top with salsa and avocado'] },
        { name: 'Salmon Sweet Potato Plate', calories: Math.min(620, maxCal), protein: Math.min(38, remainingProtein), description: 'Salmon fillet, sweet potato, and greens', instructions: ['Roast sweet potato cubes', 'Bake or pan-sear salmon', 'Saute greens with garlic', 'Serve all together'] },
        { name: 'Cottage Cheese Oats', calories: Math.min(520, maxCal), protein: Math.min(34, remainingProtein), description: 'Oats mixed with cottage cheese and berries', instructions: ['Cook oats with water or milk', 'Stir in cottage cheese off heat', 'Top with berries', 'Serve warm'] },
        { name: 'Turkey Quinoa Bowl', calories: Math.min(580, maxCal), protein: Math.min(41, remainingProtein), description: 'Ground turkey, quinoa, and roasted vegetables', instructions: ['Cook quinoa', 'Brown ground turkey with seasoning', 'Roast mixed vegetables', 'Assemble bowl and drizzle sauce'] },
        { name: 'Tofu Peanut Noodle Bowl', calories: Math.min(560, maxCal), protein: Math.min(30, remainingProtein), description: 'Tofu, noodles, and peanut-lime sauce', instructions: ['Cook noodles and drain', 'Pan-sear tofu cubes', 'Whisk peanut-lime sauce', 'Toss noodles, tofu, and sauce'] }
      ]
    } else {
      return [
        { 
          name: 'Balanced Plate', 
          calories: Math.min(500, maxCal), 
          protein: Math.min(30, remainingProtein), 
          description: 'Grilled salmon, quinoa, and roasted vegetables',
          instructions: ['Cook quinoa', 'Season and grill salmon', 'Roast vegetables with olive oil', 'Plate together']
        },
        { 
          name: 'Turkey Sandwich', 
          calories: Math.min(450, maxCal), 
          protein: Math.min(25, remainingProtein), 
          description: 'Whole grain bread with turkey, avocado, spinach, and side of fruit',
          instructions: ['Toast whole grain bread', 'Layer turkey, spinach, and avocado', 'Add seasoning or mustard', 'Serve with fresh fruit']
        },
        { 
          name: 'Buddha Bowl', 
          calories: Math.min(550, maxCal), 
          protein: Math.min(20, remainingProtein), 
          description: 'Mixed grains, chickpeas, roasted sweet potatoes, kale, and tahini dressing',
          instructions: ['Cook grains and roast sweet potato cubes', 'Warm chickpeas with spices', 'Massage kale with lemon', 'Assemble and drizzle tahini dressing']
        },
        { name: 'Egg Avocado Toast', calories: Math.min(430, maxCal), protein: Math.min(22, remainingProtein), description: 'Whole grain toast, eggs, avocado, and greens', instructions: ['Toast bread', 'Cook eggs to preference', 'Mash avocado with salt and lemon', 'Assemble toast and add greens'] },
        { name: 'Shrimp Rice Bowl', calories: Math.min(500, maxCal), protein: Math.min(30, remainingProtein), description: 'Shrimp, rice, peppers, and herbs', instructions: ['Cook rice', 'Saute shrimp and peppers', 'Season with herbs and lemon', 'Serve over rice'] },
        { name: 'Chicken Hummus Wrap', calories: Math.min(470, maxCal), protein: Math.min(31, remainingProtein), description: 'Chicken breast, hummus, and fresh vegetables', instructions: ['Warm wrap', 'Spread hummus', 'Add cooked sliced chicken and vegetables', 'Roll and slice'] },
        { name: 'Bean & Veggie Chili', calories: Math.min(460, maxCal), protein: Math.min(24, remainingProtein), description: 'Mixed beans, tomatoes, and peppers', instructions: ['Saute onions and peppers', 'Add beans, tomatoes, and spices', 'Simmer 20 minutes', 'Serve hot'] },
        { name: 'Yogurt Nut Fruit Bowl', calories: Math.min(390, maxCal), protein: Math.min(23, remainingProtein), description: 'Greek yogurt with fruit and mixed nuts', instructions: ['Add yogurt to bowl', 'Top with chopped fruit', 'Sprinkle nuts and seeds', 'Serve chilled'] }
      ]
    }
  }

  const handleAddEntry = async () => {
    if (!entry.name) {
      toast.error('Please enter a food name')
      return
    }
    if (!entry.calories) {
      toast.error('Please enter calories')
      return
    }
    
    const newEntry = {
      id: Date.now(),
      name: entry.name.toUpperCase().replace(/\s+/g, '_'),
      calories: parseInt(entry.calories),
      protein: parseInt(entry.protein) || Math.round(parseInt(entry.calories) * 0.25),
      carbs: 0,
      fat: 0,
      date: todayStr,
      mealType: 'snack',
      createdAt: new Date().toISOString(),
      time: new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
    }

    const saved = await apiPost('/meals', {
      date: todayStr,
      name: newEntry.name,
      calories: newEntry.calories,
      protein: newEntry.protein,
      carbs: 0,
      fat: 0,
      mealType: newEntry.mealType,
    })

    if (saved) {
      await refetchMeals()
    } else {
      setLocalTodayLog((prev) => [newEntry, ...prev])
    }

    setEntry({ name: '', calories: '', protein: '' })
    toast.success('Food added!')
  }

  const handleRemoveEntry = async (item) => {
    if (item?._id) {
      const ok = await apiDelete(`/meals/${item._id}`)
      if (ok) {
        await refetchMeals()
        return
      }
    }
    setLocalTodayLog((prev) => prev.filter((t) => t.id !== item.id))
  }

  const handleClearSession = async () => {
    if (window.confirm('Clear all entries for today?')) {
      const failedServerDeletes = []

      if (todayApiLog.length > 0) {
        const results = await Promise.all(
          todayApiLog.map(async (m) => {
            const ok = await apiDelete(`/meals/${m._id}`)
            if (!ok) {
              failedServerDeletes.push({
                id: Date.now() + Math.random(),
                name: m.name,
                calories: Number(m.calories) || 0,
                protein: Number(m.protein) || 0,
                carbs: Number(m.carbs) || 0,
                fat: Number(m.fat) || 0,
                date: m.date,
                mealType: m.mealType || 'snack',
                createdAt: m.createdAt || new Date().toISOString(),
              })
            }
            return ok
          })
        )
        await refetchMeals()

        if (results.some((ok) => !ok)) {
          toast.error('Some server entries could not be cleared and will retry sync')
        }
      }

      setLocalTodayLog((prev) => {
        const keepOtherDays = prev.filter((entry) => (entry.date || todayStr) !== todayStr)
        return [...failedServerDeletes, ...keepOtherDays]
      })

      toast.success('Session cleared')
    }
  }

  const handleFinalizeSession = () => {
    toast.success(
      `Session finalized: ${totals.calories.toLocaleString()} kcal, ${totals.protein}g protein`,
      { duration: 3500 }
    )
  }

  const chartMargins = { top: 20, right: 30, left: 20, bottom: 5 }
  const axisStyle = { fontSize: 11, fill: '#555' }
  const gridStyle = { stroke: '#1a1a1a', strokeDasharray: '3 3' }

  if (isLoading || (mealsLoading && localTodayLog.length === 0)) {
    return (
      <div className="min-h-screen p-8" style={{ background: theme.page }}>
        <DietSkeleton />
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white font-sans overflow-x-hidden flex flex-col" style={{ background: theme.page }}>
      <div className="fixed inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="fixed -top-40 -right-40 w-[420px] h-[420px] rounded-full blur-3xl opacity-30" style={{ background: theme.accent }} />
      <div className="fixed -bottom-44 -left-40 w-[380px] h-[380px] rounded-full blur-3xl opacity-20 bg-orange-500" />
      
      <header className="h-20 backdrop-blur-xl flex items-center justify-between px-8 z-50" style={{ background: MATTE.panel, borderBottom: `2px solid ${MATTE.border}` }}>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2.5 rounded-lg transition-colors border"
            style={{ borderColor: MATTE.borderSoft, background: MATTE.tile }}
          >
            <ArrowLeft style={{ color: theme.accent }} size={22} />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Radio className="text-cyan-400" size={28} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-100 uppercase">
              Diet Tracker
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-3xl font-bold" style={{ color: theme.accent }}>
              {totals.calories.toLocaleString()}
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">TOTAL KCAL</div>
          </div>
          
          <div className="w-24 h-24 relative">
            <svg className="w-full h-full -rotate-90">
              <circle cx="48" cy="48" r="42" fill="none" stroke="#0f172a" strokeWidth="6" />
              <motion.circle 
                cx="48" cy="48" r="42" 
                fill="none" 
                stroke="url(#calGradient)" 
                strokeWidth="6"
                strokeDasharray={2 * Math.PI * 42}
                initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - calProgress/100) }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round"
              />
              <circle cx="48" cy="48" r="32" fill="none" stroke="#0f172a" strokeWidth="6" />
              <motion.circle 
                cx="48" cy="48" r="32" 
                fill="none" 
                stroke="url(#proGradient)" 
                strokeWidth="6"
                strokeDasharray={2 * Math.PI * 32}
                initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 32 * (1 - proProgress/100) }}
                transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                {Math.round((calProgress + proProgress)/2)}%
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">PROGRESS</div>
            </div>
            <defs>
              <linearGradient id="calGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="proGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] mx-auto w-full p-6 md:p-8 lg:px-12 space-y-10 relative z-10 overflow-hidden">
        <div className="glass-card rounded-sm p-1 lg:ml-10 lg:mr-24 rotate-[-0.35deg]" style={{ border: `2px solid ${MATTE.border}` }}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            <input 
              type="text" 
              value={entry.name} 
              onChange={(e) => setEntry({...entry, name: e.target.value})}
              placeholder="Food Name" 
              className="bg-black/35 border rounded-xl px-5 py-4 text-sm placeholder:text-zinc-500 focus:outline-none transition-all md:col-span-2 font-bold tracking-wide"
              style={{ borderColor: MATTE.borderSoft }}
            />
            <input 
              type="number" 
              value={entry.calories} 
              onChange={(e) => setEntry({...entry, calories: e.target.value})}
              placeholder="KCAL" 
              className="bg-black/35 border rounded-xl px-5 py-4 font-bold placeholder:text-zinc-500 focus:outline-none transition-all text-center"
              style={{ borderColor: MATTE.borderSoft, color: theme.accent }}
            />
            <input 
              type="number" 
              value={entry.protein} 
              onChange={(e) => setEntry({...entry, protein: e.target.value})}
              placeholder="PROTEIN (G)" 
              className="bg-black/35 border rounded-xl px-5 py-4 font-bold text-amber-400 placeholder:text-zinc-500 focus:outline-none transition-all text-center"
              style={{ borderColor: MATTE.borderSoft }}
            />
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddEntry}
                className="flex-1 rounded-xl font-black py-4 text-black transition-all flex items-center justify-center gap-2 uppercase tracking-[0.1em]"
                style={{ background: theme.accent, border: '2px solid rgba(0,0,0,0.45)', boxShadow: '4px 4px 0 rgba(0,0,0,0.55)' }}
              >
                <Plus size={20} />
                <span className="hidden md:inline">Add</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={getAIMealSuggestions}
                disabled={isLoadingAI}
                className="px-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2"
                style={{ background: 'rgba(255,255,255,0.12)', border: `2px solid ${MATTE.borderSoft}`, boxShadow: '3px 3px 0 rgba(0,0,0,0.5)' }}
                title="Get AI meal suggestions"
              >
                {isLoadingAI ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles size={20} />
                  </motion.div>
                ) : (
                  <ChefHat size={20} />
                )}
              </motion.button>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500 px-3">
            <span>Add foods and track calories/protein for today</span>
            <span>Live totals</span>
          </div>
        </div>

        <AnimatePresence>
          {showAISuggestions && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card rounded-sm border p-6 relative overflow-hidden lg:ml-24 lg:mr-16 rotate-[0.3deg]"
              style={{ borderColor: MATTE.border }}
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-purple-600/10 blur-[60px] rounded-full pointer-events-none" />
              
              <div className="relative z-10 flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="text-purple-400" size={24} />
                  <h3 className="text-xl font-bold text-white">AI Meal Suggestions</h3>
                </div>
                <button
                  onClick={() => setShowAISuggestions(false)}
                  className="relative z-20 text-slate-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-4 rounded-xl border p-3 flex flex-col md:flex-row gap-2" style={{ borderColor: MATTE.borderSoft, background: 'rgba(0,0,0,0.22)' }}>
                <input
                  type="text"
                  value={aiRefineInput}
                  onChange={(e) => setAiRefineInput(e.target.value)}
                  placeholder="Ask for different foods (e.g. no eggs, vegetarian, more Indian foods)"
                  className="flex-1 bg-black/40 border rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                  style={{ borderColor: MATTE.borderSoft }}
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => getAIMealSuggestions(aiRefineInput.trim())}
                  disabled={isLoadingAI}
                  className="px-4 py-2 rounded-lg font-semibold text-black flex items-center justify-center gap-2"
                  style={{ background: theme.accent, border: '2px solid rgba(0,0,0,0.45)' }}
                >
                  <RefreshCw size={15} />
                  Different Foods
                </motion.button>
              </div>

              <div className="mb-4 text-xs text-zinc-400 flex items-center justify-between">
                <span>Goal: {aiContext.goal.replace('_', ' ')} | Meal type: {aiContext.mealType}</span>
                <span>{aiSuggestions.length} suggestions</span>
              </div>

              {aiError ? (
                <p className="text-red-400 text-center py-4">Failed to get suggestions. Try again.</p>
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  {aiSuggestions.map((suggestion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-black/40 rounded-xl p-5 border border-purple-500/20 hover:border-purple-500/40 transition-all group"
                    >
                      <button
                        onClick={() => setExpandedSuggestionIndex(expandedSuggestionIndex === index ? null : index)}
                        className="w-full text-left"
                      >
                        <ChefHat size={24} className="text-purple-400 mb-3" />
                        <h4 className="font-bold text-white mb-2">{suggestion.name}</h4>
                        <p className="text-xs text-slate-400 mb-3">{suggestion.description}</p>
                      </button>
                      <div className="flex justify-between text-sm">
                        <span className="text-cyan-400">{suggestion.calories} kcal</span>
                        <span className="text-amber-400">{suggestion.protein}g protein</span>
                      </div>

                      {expandedSuggestionIndex === index && (
                        <div className="mt-4 pt-3 border-t border-purple-500/20">
                          <div className="text-[11px] uppercase tracking-[0.12em] text-purple-300 mb-2">How To Cook</div>
                          <ol className="text-xs text-zinc-300 space-y-1 list-decimal pl-4">
                            {(suggestion.instructions && suggestion.instructions.length > 0
                              ? suggestion.instructions
                              : ['Prep ingredients', 'Cook using preferred method', 'Assemble and serve'])
                              .slice(0, 8)
                              .map((step, stepIndex) => (
                                <li key={stepIndex}>{step}</li>
                              ))}
                          </ol>
                        </div>
                      )}

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setEntry({
                            name: suggestion.name,
                            calories: suggestion.calories.toString(),
                            protein: suggestion.protein.toString()
                          })
                          setShowAISuggestions(false)
                        }}
                        className="mt-4 w-full py-2 rounded-lg font-semibold text-black"
                        style={{ background: theme.accent }}
                      >
                        Use This Meal
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* TODAY'S LOG */}
          <div className="lg:col-span-7 space-y-6 lg:translate-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-[0.08em] flex items-center gap-2">
                  <BarChart3 className="text-cyan-400" size={22} />
                  Today's Log
                </h2>
                <p className="text-cyan-500/60 text-sm mt-1">Meals added today</p>
              </div>
              <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-sm font-mono">
                {todayLog.length} ENTRIES
              </span>
            </div>

            {todayLog.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No Entries Yet"
                message="Add your first food entry to start tracking your nutrition."
              />
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scroll">
                <AnimatePresence>
                  {todayLog.map((item, i) => (
                    <motion.div
                      key={item._id || item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-card rounded-sm p-5 border transition-all group"
                      style={{ borderColor: MATTE.border, boxShadow: '6px 6px 0 rgba(0,0,0,0.5)' }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="text-xs text-cyan-500/70 font-mono">{item.time}</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          </div>
                          <h3 className="font-black text-xl tracking-tight uppercase">{item.name}</h3>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRemoveEntry(item)}
                          className="text-zinc-500 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </motion.button>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-2 gap-4 pt-3 border-t" style={{ borderColor: MATTE.borderSoft }}>
                        <div>
                          <div className="text-[11px] text-zinc-500 mb-1">Calories</div>
                          <div className="text-2xl font-bold" style={{ color: theme.accent }}>
                            {item.calories.toLocaleString()}
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">kcal</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-zinc-500 mb-1">Protein</div>
                          <div className="text-2xl font-bold text-amber-400">
                            {item.protein}
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">grams</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* BIOMETRICS & HISTORY */}
          <div className="lg:col-span-5 space-y-8 lg:-translate-y-10">
            {/* PROGRESS METERS */}
            <div className="glass-card rounded-sm p-6" style={{ border: `2px solid ${MATTE.border}` }}>
              <div className="space-y-6">
                {/* Calories */}
                <div>
                  <div className="flex justify-between mb-2">
                    <div>
                      <div className="text-[11px] text-cyan-500/60 font-mono">DAILY GOAL</div>
                      <div className="font-bold mt-0.5">Calories</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                        {totals.calories.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-cyan-500/40">/ {CALORIE_GOAL.toLocaleString()} kcal</div>
                    </div>
                  </div>
                  <div className="h-3 bg-black/40 rounded-full overflow-hidden relative">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${calProgress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                  </div>
                </div>
                
                {/* Protein */}
                <div>
                  <div className="flex justify-between mb-2">
                    <div>
                      <div className="text-[11px] text-amber-400/60 font-mono">DAILY GOAL</div>
                      <div className="font-bold mt-0.5">Protein</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xl text-amber-400">
                        {totals.protein}
                      </div>
                      <div className="text-[11px] text-amber-400/40">/ {PROTEIN_GOAL}g</div>
                    </div>
                  </div>
                  <div className="h-3 bg-black/40 rounded-full overflow-hidden relative">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${proProgress}%` }}
                      transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                  </div>
                </div>
              </div>
            </div>

            {/* HISTORY CHART */}
            <div className="glass-card rounded-sm p-5 rotate-[-0.35deg]" style={{ border: `2px solid ${MATTE.border}` }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-[0.08em] flex items-center gap-2">
                    <Flame className="text-amber-400" size={22} />
                    7-Day Trends
                  </h2>
                  <p className="text-cyan-500/60 text-sm mt-1">Calories and protein over last 7 days</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
                    <span>Calories</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
                    <span>Protein</span>
                  </div>
                </div>
              </div>
              
              <div className="h-[280px] -mx-3">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <LineChart data={historyData} margin={chartMargins}>
                    <defs>
                      <linearGradient id="calArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="proArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...gridStyle} vertical={false} />
                    <XAxis dataKey="day" {...axisStyle} tickLine={false} axisLine={{ stroke: '#334155' }} />
                    <YAxis yAxisId="left" {...axisStyle} tickLine={false} axisLine={false} width={45} />
                    <YAxis yAxisId="right" {...axisStyle} tickLine={false} axisLine={false} orientation="right" width={45} />
                    <Tooltip content={(props) => <CustomTooltip {...props} calorieGoal={CALORIE_GOAL} accent={theme.accent} />} cursor={{ stroke: theme.accent, strokeDasharray: '3 3' }} />
                    <ReferenceLine yAxisId="left" y={CALORIE_GOAL} stroke="#06b6d4" strokeDasharray="3 3" label={{ value: 'Target', position: 'insideTopLeft', fill: '#06b6d4', fontSize: 11 }} />
                    <ReferenceLine yAxisId="right" y={PROTEIN_GOAL} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'Target', position: 'insideTopRight', fill: '#f97316', fontSize: 11 }} />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="cals" 
                      stroke="url(#calArea)" 
                      strokeWidth={3} 
                      dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }} 
                      activeDot={{ r: 8 }} 
                      fill="url(#calArea)" 
                      fillOpacity={0.4} 
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="pro" 
                      stroke="url(#proArea)" 
                      strokeWidth={3} 
                      dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }} 
                      activeDot={{ r: 8 }} 
                      fill="url(#proArea)" 
                      fillOpacity={0.4} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-3 text-center p-3 bg-black/30 rounded-xl">
                <div>
                  <div className="text-[11px] text-cyan-500/60">AVG CALORIES</div>
                  <div className="font-bold mt-1 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                    {Math.round(historyData.reduce((sum, d) => sum + d.cals, 0) / historyData.length).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-amber-400/60">AVG PROTEIN</div>
                  <div className="font-bold mt-1 text-amber-400">
                    {Math.round(historyData.reduce((sum, d) => sum + d.pro, 0) / historyData.length)}g
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS WITH CLEAR SESSION */}
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClearSession}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-sm font-black py-4 text-white transition-all shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 uppercase tracking-[0.1em]"
                style={{ border: '2px solid rgba(0,0,0,0.5)', boxShadow: '5px 5px 0 rgba(0,0,0,0.6)' }}
              >
                <Trash2 size={18} />
                Clear Day
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFinalizeSession}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 rounded-sm font-black py-5 text-white text-lg transition-all shadow-lg shadow-cyan-500/30 uppercase tracking-[0.1em]"
                style={{ border: '2px solid rgba(0,0,0,0.5)', boxShadow: '5px 5px 0 rgba(0,0,0,0.6)' }}
              >
                Save Day
              </motion.button>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .glass-card {
          background: ${MATTE.panel};
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 8px 8px 0 rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .custom-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.45);
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: ${theme.accent};
          border-radius: 10px;
          border: 1px solid rgba(0,0,0,0.5);
          background-clip: content-box;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          filter: brightness(1.12);
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2.5s infinite linear;
        }
      `}</style>
    </div>
  )
}

export default DietTracker
