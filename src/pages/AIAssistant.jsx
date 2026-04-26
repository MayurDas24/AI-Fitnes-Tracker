import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Send, Zap, Dumbbell, Apple, TrendingUp,
  User, Bot, Loader2, X, ChevronRight, Sparkles,
  RotateCcw, Activity, Flame, Target, Brain
} from 'lucide-react'
import { sendAIMessage } from '../services/api'
import { useApi } from '../hooks/useApi'

// ─── AI CONFIG ───────────────────────────────────────────────────────────────
// Primary path: backend /api/ai/chat proxy via sendAIMessage()

// ─── LOAD ALL USER DATA FROM LOCALSTORAGE ─────────────────────────────────────
function getUserContext() {
  const safe = (key, fallback = null) => {
    try {
      const v = localStorage.getItem(key)
      return v ? JSON.parse(v) : fallback
    } catch { return fallback }
  }

  const profile = safe('profileData') || safe('userProfile')
  const workoutHistory = Array.isArray(safe('workoutHistory')) ? safe('workoutHistory') : []
  const currentWorkout = Array.isArray(safe('currentWorkout')) ? safe('currentWorkout') : []
  const todayLog = Array.isArray(safe('todayLog')) ? safe('todayLog') : []
  const dailyMeals = Array.isArray(safe('dailyMeals')) ? safe('dailyMeals') : []
  const calorieData = safe('userCalorieData')
  const waterIntake = safe('waterIntake')
  const progressPhotos = Array.isArray(safe('progressPhotos')) ? safe('progressPhotos') : []
  const savedAnalyses = Array.isArray(safe('savedAnalyses')) ? safe('savedAnalyses') : []

  const totalWorkouts = workoutHistory.length
  const totalVolume = workoutHistory.reduce((s, w) => s + (w?.volume || 0), 0)
  const avgCalories = workoutHistory.length
    ? Math.round(workoutHistory.reduce((s, w) => s + (w?.calories || 0), 0) / workoutHistory.length)
    : 0

  const todayCalories = todayLog.reduce((s, m) => s + (m?.calories || 0), 0)
  const todayProtein = todayLog.reduce((s, m) => s + (m?.protein || 0), 0)

  return {
    profile,
    workoutHistory: workoutHistory.slice(0, 10),
    currentWorkout,
    todayLog,
    calorieData,
    waterIntake,
    totalWorkouts,
    totalVolume,
    avgCalories,
    todayCalories,
    todayProtein,
    progressPhotos: progressPhotos.length,
    savedAnalyses,
    raw: {
      dailyMeals: dailyMeals.slice(0, 5)
    }
  }
}

// ─── BUILD SYSTEM PROMPT WITH REAL USER DATA ──────────────────────────────────
function buildSystemPrompt(ctx) {
  const p = ctx.profile
  return `You are an elite AI personal trainer and nutritionist inside an AI Fitness Tracker app. You have FULL access to this user's real fitness data. Be specific, data-driven, and feel like a real coach who actually knows them — not a generic chatbot.

USER PROFILE:
${p ? `- Name: ${p.name || 'User'}
- Age: ${p.age || 'unknown'} | Gender: ${p.gender || 'unknown'}
- Weight: ${p.weight || '?'}kg | Height: ${p.height || '?'}cm
- Goal: ${p.fitnessGoal || p.goal || 'not set'}
- Activity Level: ${p.activityLevel || 'unknown'}
- Experience: ${p.experience || 'unknown'}` : '- No profile set up yet'}

WORKOUT DATA:
- Total workouts completed: ${ctx.totalWorkouts}
- Total volume lifted all time: ${ctx.totalVolume.toLocaleString()}kg
- Avg calories burned per workout: ${ctx.avgCalories} kcal
${ctx.workoutHistory.length > 0 ? `- Recent workouts: ${ctx.workoutHistory.slice(0, 5).map(w => `${w?.date || 'Unknown'} (${w?.exercises || 0} exercises, ${w?.volume || 0}kg volume)`).join(', ')}` : '- No workout history yet'}
${ctx.currentWorkout.length > 0 ? `- Current active workout: ${ctx.currentWorkout.map(e => e?.name || 'Exercise').filter(Boolean).join(', ')}` : ''}

TODAY'S NUTRITION:
- Calories consumed today: ${ctx.todayCalories} kcal
- Protein today: ${ctx.todayProtein}g
${ctx.calorieData ? `- Daily calorie goal: ${ctx.calorieData.goalCalories || ctx.calorieData.maintenanceCalories || 'not set'} kcal` : ''}
${ctx.todayLog.length > 0 ? `- Foods logged: ${ctx.todayLog.map(m => m?.name || m?.food).filter(Boolean).join(', ')}` : '- No food logged today'}

OTHER:
- Water tracker in use: ${ctx.waterIntake ? 'yes' : 'no'}
- Progress photos: ${ctx.progressPhotos}
- Body analyses saved: ${ctx.savedAnalyses.length}

RESPONSE RULES:
1. Be conversational and direct — like a real coach texting them
2. Use their ACTUAL data when relevant (mention real numbers, real workouts)
3. Be specific — never give generic advice if you have their data
4. Use bullet points for lists, be concise
5. If they ask about a workout plan, use their goal and experience level
6. If they ask about nutrition, use their actual calorie/protein data
7. Respond in markdown — bold key points, use bullets
8. End with ONE specific actionable tip or question to keep the conversation going
9. Keep responses focused — not too long unless they ask for detailed plans`
}

// ─── QUICK ACTION BUTTONS ─────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    icon: TrendingUp,
    label: 'Analyze my progress',
    color: '#38bdf8',
    prompt: 'Analyze my workout history and progress. What are my strengths and weaknesses? What should I focus on?'
  },
  {
    icon: Dumbbell,
    label: 'Build me a workout',
    color: '#f59e0b',
    prompt: "Create a personalized workout plan for today based on my goals, experience level, and recent training history."
  },
  {
    icon: Apple,
    label: 'Plan my nutrition',
    color: '#22c55e',
    prompt: "Based on my calorie goal and today's food log, tell me exactly what I should eat for the rest of today to hit my macro targets."
  },
  {
    icon: Target,
    label: 'Am I on track?',
    color: '#8b5cf6',
    prompt: "Look at all my data — workouts, nutrition, progress — and give me an honest assessment. Am I on track to reach my goals?"
  },
  {
    icon: Flame,
    label: 'How to break plateau',
    color: '#ef4444',
    prompt: "I feel like I'm stuck. Based on my workout history and current routine, what specific changes should I make to break through my plateau?"
  },
  {
    icon: Brain,
    label: 'Recovery advice',
    color: '#a855f7',
    prompt: "Based on my recent training volume and frequency, what does my recovery look like? Am I overtraining or undertraining? What should I do?"
  }
]

function localCoachReply(userText, ctx) {
  const t = String(userText || '').toLowerCase()
  const proteinTarget = Math.max(120, Math.round((Number(ctx.profile?.weight) || 62) * 2.2))

  if (/workout|plan|train|exercise/.test(t)) {
    return `Local coach mode (no API key):\n\n- **Today's focus:** Push + Pull + Legs split\n- **Main lifts:** Squat 4x6-8, Bench 4x6-8, Row 4x8-10\n- **Accessory:** Shoulder press 3x10, lateral raise 3x15, curls 3x12\n- **Target session duration:** 60-75 min\n\nYou have **${ctx.totalWorkouts} workouts** logged. Progression tip: add 2.5kg to your top set when reps hit upper range.`
  }

  if (/diet|nutrition|calorie|protein|eat|meal|macro/.test(t)) {
    return `Local coach mode (no API key):\n\n- **Calories today:** ${ctx.todayCalories} kcal\n- **Protein today:** ${ctx.todayProtein} g\n- **Protein target:** ~${proteinTarget} g\n- Keep meals at 30-45g protein each for muscle gain\n\nAction: add one high-protein meal now (eggs + greek yogurt or chicken + rice).`
  }

  if (/progress|track|goal|on track|plateau/.test(t)) {
    return `Local coach mode (no API key):\n\n- Workouts completed: **${ctx.totalWorkouts}**\n- Total training volume: **${ctx.totalVolume.toLocaleString()} kg**\n- Today's intake: **${ctx.todayCalories} kcal / ${ctx.todayProtein}g protein**\n\nFor your muscle-gain goal, stay in a small surplus and keep progressive overload on 3 core lifts weekly.`
  }

  return `Local coach mode (no API key):\n\nI can still coach you with your app data:\n- Workouts: **${ctx.totalWorkouts}**\n- Volume: **${ctx.totalVolume.toLocaleString()} kg**\n- Today: **${ctx.todayCalories} kcal**, **${ctx.todayProtein}g protein**\n\nAsk me: "build me today's workout" or "fix my nutrition today".`
}

// ─── TYPING INDICATOR ─────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex items-end gap-3 mb-6">
    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #ff1a1a, #cc0000)', boxShadow: '0 0 15px rgba(255,26,26,0.4)' }}>
      <Bot size={16} className="text-white" />
    </div>
    <div className="px-5 py-4 rounded-2xl rounded-bl-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex gap-1.5 items-center h-5">
        {[0, 1, 2].map(i => (
          <motion.div key={i} className="w-2 h-2 rounded-full" style={{ background: '#ff1a1a' }}
            animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
        ))}
      </div>
    </div>
  </div>
)

// ─── MESSAGE BUBBLE ───────────────────────────────────────────────────────────
const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user'

  const renderContent = (text) => {
    const lines = text.split('\n')
    return lines.map((line, i) => {
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return (
          <div key={i} className="flex gap-2 my-0.5">
            <span className="mt-1 flex-shrink-0" style={{ color: '#ff4444' }}>▸</span>
            <span dangerouslySetInnerHTML={{ __html: line.slice(2) }} />
          </div>
        )
      }
      if (/^\d+\.\s/.test(line)) {
        const num = line.match(/^(\d+)\./)[1]
        return (
          <div key={i} className="flex gap-2 my-0.5">
            <span className="font-black flex-shrink-0 w-4" style={{ color: '#ff4444' }}>{num}.</span>
            <span dangerouslySetInnerHTML={{ __html: line.replace(/^\d+\.\s/, '') }} />
          </div>
        )
      }
      if (line.trim() === '') return <div key={i} className="h-2" />
      return <div key={i} dangerouslySetInnerHTML={{ __html: line }} />
    })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`flex items-end gap-3 mb-6 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={isUser
        ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }
        : { background: 'linear-gradient(135deg, #ff1a1a, #cc0000)', boxShadow: '0 0 12px rgba(255,26,26,0.35)' }}>
        {isUser ? <User size={16} className="text-zinc-400" /> : <Bot size={16} className="text-white" />}
      </div>
      <div className="max-w-[80%] px-5 py-4 rounded-2xl text-sm leading-relaxed" style={isUser
        ? { background: 'linear-gradient(135deg, #ff1a1a, #cc0000)', color: '#ffffff', borderRadius: '16px 16px 4px 16px', boxShadow: '0 0 20px rgba(255,26,26,0.2)' }
        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#e4e4e7', borderRadius: '4px 16px 16px 16px' }}>
        {isUser ? <p>{message.content}</p> : <div className="space-y-0.5">{renderContent(message.content)}</div>}
      </div>
    </motion.div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AIAssistant() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const localCtx = useMemo(() => getUserContext(), [])
  const { data: apiUser } = useApi('/auth/me')
  const { data: apiWorkouts } = useApi('/workouts')
  const { data: apiMeals } = useApi('/meals')
  const { data: apiWaterToday } = useApi('/water/today')
  const { data: apiBodyAnalyses } = useApi('/body-analysis')
  const [lastRequestTime, setLastRequestTime] = useState(0)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const userCtx = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]

    const profileData = apiUser?.profileData || {}
    const mergedProfile = {
      ...(localCtx.profile || {}),
      name: apiUser?.name || localCtx.profile?.name,
      age: profileData.age ?? localCtx.profile?.age,
      gender: profileData.gender ?? localCtx.profile?.gender,
      weight: profileData.weight ?? localCtx.profile?.weight,
      height: profileData.height ?? localCtx.profile?.height,
      fitnessGoal: profileData.fitnessGoal ?? localCtx.profile?.fitnessGoal,
      activityLevel: profileData.activityLevel ?? localCtx.profile?.activityLevel,
      experience: localCtx.profile?.experience,
    }

    const workouts = Array.isArray(apiWorkouts) && apiWorkouts.length > 0
      ? apiWorkouts
      : (localCtx.workoutHistory || [])

    const todayMeals = Array.isArray(apiMeals) && apiMeals.length > 0
      ? apiMeals.filter((m) => String(m?.date || '').slice(0, 10) === today)
      : (localCtx.todayLog || [])

    const totalWorkouts = workouts.length
    const totalVolume = workouts.reduce((s, w) => s + (Number(w?.volume) || 0), 0)
    const avgCalories = workouts.length
      ? Math.round(workouts.reduce((s, w) => s + (Number(w?.calories) || 0), 0) / workouts.length)
      : 0

    const todayCalories = todayMeals.reduce((s, m) => s + (Number(m?.calories) || 0), 0)
    const todayProtein = todayMeals.reduce((s, m) => s + (Number(m?.protein) || 0), 0)

    return {
      profile: mergedProfile,
      workoutHistory: workouts.slice(0, 10),
      currentWorkout: localCtx.currentWorkout || [],
      todayLog: todayMeals,
      calorieData: localCtx.calorieData,
      waterIntake: apiWaterToday?.amount ?? localCtx.waterIntake,
      totalWorkouts,
      totalVolume,
      avgCalories,
      todayCalories,
      todayProtein,
      progressPhotos: localCtx.progressPhotos || 0,
      savedAnalyses: Array.isArray(apiBodyAnalyses) && apiBodyAnalyses.length > 0
        ? apiBodyAnalyses
        : (localCtx.savedAnalyses || []),
      raw: {
        dailyMeals: (localCtx.raw?.dailyMeals || []).slice(0, 5),
      },
    }
  }, [localCtx, apiUser, apiWorkouts, apiMeals, apiWaterToday, apiBodyAnalyses])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (messages.length > 0) return

    const name = userCtx.profile?.name
    const hasData = userCtx.totalWorkouts > 0 || userCtx.todayCalories > 0

    const welcome = name
      ? `Hey ${name}! 👋 I'm your AI trainer. I can see your fitness data — ${userCtx.totalWorkouts} workouts logged${userCtx.todayCalories > 0 ? `, ${userCtx.todayCalories} calories today` : ''}. What do you want to work on?`
      : `Hey! I'm your AI personal trainer. ${hasData ? `I can see your fitness data — ask me anything about your progress, workouts, or nutrition.` : `Set up your profile to get personalized advice, or just ask me anything about fitness!`}`

    setMessages([{ id: 1, role: 'assistant', content: welcome }])
  }, [userCtx, messages.length])

  const sendMessage = useCallback(async (userText) => {
    if (!userText.trim() || isLoading) return

    const userMsg = { id: Date.now(), role: 'user', content: userText }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    setShowQuickActions(false)

    const systemPrompt = buildSystemPrompt(userCtx)
    const history = [...messages, userMsg]

    const aiMessages = [
      { role: 'user', content: systemPrompt },
      ...history.map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
    ]

    try {
      const data = await sendAIMessage(aiMessages)

      const text = data?.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.'

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: text,
        streaming: false,
      }])

    } catch (err) {
      console.error('AI request error:', err)

      const fallback = localCoachReply(userText, userCtx)
      const errorContent = `Live AI is unavailable right now, so I switched to local coach mode.\n\n${fallback}`

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: errorContent,
        streaming: false,
      }])
    } finally {
      setIsLoading(false)
    }
  }, [messages, isLoading, userCtx])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleQuickAction = (prompt) => {
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    const cooldownMs = 65000 // 65 seconds

    if (timeSinceLastRequest < cooldownMs) {
      const secondsLeft = Math.ceil((cooldownMs - timeSinceLastRequest) / 1000)
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'assistant',
        content: `⏳ **Please wait ${secondsLeft} more seconds** before making another request. The API has rate limits to prevent abuse.`,
        streaming: false
      }])
      return
    }

    setLastRequestTime(now)
    sendMessage(prompt)
  }

  const clearChat = () => {
    const name = userCtx.profile?.name
    setMessages([{
      id: Date.now(),
      role: 'assistant',
      content: name ? `Fresh start, ${name}! What do you want to work on?` : 'Fresh start! What do you want to work on?'
    }])
    setShowQuickActions(true)
  }

  const stats = [
    { label: 'Workouts', value: userCtx.totalWorkouts, icon: Dumbbell, color: '#f59e0b' },
    { label: 'Volume', value: `${Math.round(userCtx.totalVolume / 1000)}t`, icon: TrendingUp, color: '#38bdf8' },
    { label: 'Today kcal', value: userCtx.todayCalories, icon: Flame, color: '#f97316' },
    { label: 'Protein', value: `${userCtx.todayProtein}g`, icon: Target, color: '#22c55e' },
  ]

  return (
    <div className="min-h-screen text-white flex flex-col selection:bg-red-500" style={{ background: '#020202', fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Grid overlay */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      {/* Glow orb */}
      <div className="fixed pointer-events-none z-0" style={{ width: '600px', height: '500px', top: '0', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle, rgba(255,26,26,0.04), transparent 70%)' }} />

      {/* HEADER */}
      <motion.header className="flex-shrink-0 sticky top-0 z-50 px-6 h-18 py-4 flex items-center justify-between relative" style={{ background: 'rgba(2,2,2,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,26,26,0.08)' }} initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,26,26,0.45), transparent)' }} />
        <div className="flex items-center gap-4 relative z-10">
          <motion.button onClick={() => navigate('/dashboard')} className="p-3 rounded-xl border transition-all" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <ArrowLeft size={18} className="text-zinc-500" />
          </motion.button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ff1a1a, #cc0000)', boxShadow: '0 0 20px rgba(255,26,26,0.4)' }}>
              <Brain size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-black italic tracking-tighter uppercase text-lg" style={{ fontFamily: 'JetBrains Mono, monospace' }}>AI_TRAINER</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-green-400" style={{ boxShadow: '0 0 6px #4ade80' }} />
                <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace' }}>BACKEND AI • AUTO FALLBACK</span>
              </div>
            </div>
          </div>
        </div>
        <motion.button onClick={clearChat} className="p-3 rounded-xl border transition-all relative z-10" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} title="Clear chat">
          <RotateCcw size={16} className="text-zinc-500" />
        </motion.button>
      </motion.header>

      {/* STATS BAR */}
      <div className="flex-shrink-0 px-6 py-3 relative z-10" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(2,2,2,0.6)' }}>
        <div className="flex gap-6 overflow-x-auto pb-1 max-w-4xl mx-auto">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-2 flex-shrink-0">
              <stat.icon size={12} style={{ color: stat.color }} />
              <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{stat.label}:</span>
              <span className="text-[9px] font-black" style={{ color: stat.color, fontFamily: 'JetBrains Mono, monospace' }}>{stat.value || '—'}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 flex-shrink-0 ml-2 pl-4" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
            <Sparkles size={10} style={{ color: '#ff1a1a' }} />
            <span className="text-[9px] text-zinc-700 font-black uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace' }}>LIVE DATA CONNECTED</span>
          </div>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full relative z-10">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <TypingIndicator />
        )}

        <AnimatePresence>
          {showQuickActions && messages.length <= 2 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-4">
              <p className="text-[9px] text-zinc-600 mb-3 font-black uppercase tracking-[0.3em]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>◈ QUICK COMMANDS</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {QUICK_ACTIONS.map((action, i) => (
                  <motion.button key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    onClick={() => handleQuickAction(action.prompt)}
                    className="flex items-center gap-3 p-4 text-left transition-all group rounded-xl border relative overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}
                    whileHover={{ scale: 1.02, borderColor: `${action.color}40`, background: `${action.color}08` }}
                    whileTap={{ scale: 0.98 }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${action.color}20`, border: `1px solid ${action.color}30` }}>
                      <action.icon size={16} style={{ color: action.color }} />
                    </div>
                    <span className="text-sm font-bold text-zinc-300">{action.label}</span>
                    <ChevronRight size={14} className="text-zinc-700 ml-auto group-hover:text-zinc-400 transition-colors" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT BAR */}
      <div className="flex-shrink-0 px-4 py-4 relative z-10" style={{ background: 'rgba(2,2,2,0.92)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,26,26,0.06)' }}>
        <div className="max-w-4xl mx-auto flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me about your training, nutrition, recovery..."
              rows={1}
              disabled={isLoading}
              className="w-full rounded-2xl px-5 py-4 text-sm placeholder:text-zinc-700 resize-none focus:outline-none transition-all disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#e4e4e7', maxHeight: '120px' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(255,26,26,0.3)'; e.target.style.boxShadow = '0 0 20px rgba(255,26,26,0.08)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.06)'; e.target.style.boxShadow = 'none' }}
              onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
            />
          </div>
          <motion.button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all flex-shrink-0"
            style={{ background: !input.trim() || isLoading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #ff1a1a, #cc0000)', boxShadow: !input.trim() || isLoading ? 'none' : '0 0 20px rgba(255,26,26,0.35)' }}>
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-zinc-500" /> : <Send size={18} className={!input.trim() ? 'text-zinc-700' : 'text-white'} />}
          </motion.button>
        </div>
        <p className="text-center text-[9px] text-zinc-700 mt-2 font-black uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          ENTER TO SEND • SHIFT+ENTER FOR NEW LINE
        </p>
      </div>
    </div>
  )
}