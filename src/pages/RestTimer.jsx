import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Play, Pause, RotateCcw, Plus, Minus, Volume2, VolumeX, Zap, Timer } from 'lucide-react'

const PROTOCOLS = [
  { label: 'STRENGTH', seconds: 180, color: '#ff1a1a', desc: 'Heavy compound lifts' },
  { label: 'HYPERTROPHY', seconds: 90, color: '#ff6600', desc: 'Muscle building sets' },
  { label: 'ENDURANCE', seconds: 45, color: '#22c55e', desc: 'Circuit & cardio' },
  { label: 'POWER', seconds: 240, color: '#a855f7', desc: 'Explosive movements' },
  { label: 'HIIT', seconds: 30, color: '#06b6d4', desc: 'High intensity intervals' },
]

function RestTimer() {
  const navigate = useNavigate()
  const [preset, setPreset] = useState(60)
  const [time, setTime] = useState(60)
  const [isRunning, setIsRunning] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isComplete, setIsComplete] = useState(false)
  const [selectedProtocol, setSelectedProtocol] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!isRunning) {
      clearInterval(intervalRef.current)
      return () => clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      setTime(prev => {
        if (prev <= 1) {
          setIsRunning(false)
          setIsComplete(true)
          if (soundEnabled) playSound()
          clearInterval(intervalRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [isRunning, soundEnabled])

  const playSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      ;[0, 0.15, 0.3].forEach(delay => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.frequency.value = delay === 0 ? 660 : delay === 0.15 ? 880 : 1100
        osc.type = 'sine'
        gain.gain.setValueAtTime(0.4, ctx.currentTime + delay)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.4)
        osc.start(ctx.currentTime + delay)
        osc.stop(ctx.currentTime + delay + 0.4)
      })
    } catch {
      // Audio APIs may be blocked; fail silently and keep timer flow intact.
    }
  }

  const handleStart = () => {
    if (isComplete) { setIsComplete(false); setTime(preset); return }
    setIsRunning(r => !r)
  }

  const handleReset = () => {
    setIsRunning(false); setIsComplete(false); setTime(preset)
    clearInterval(intervalRef.current)
  }

  const handleProtocol = (p) => {
    if (isRunning) return
    setSelectedProtocol(p.label); setPreset(p.seconds); setTime(p.seconds); setIsComplete(false)
  }

  const adjustTime = (delta) => {
    if (isRunning) return
    const next = Math.max(10, Math.min(600, time + delta))
    setTime(next); setPreset(next); setIsComplete(false)
  }

  const formatTime = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  const radius = 130
  const circ = 2 * Math.PI * radius
  const progress = preset > 0 ? time / preset : 0
  const dashOffset = circ * (1 - progress)

  const activeColor = isComplete ? '#22c55e' : isRunning ? '#ff6600' : '#ff1a1a'
  const glowColor = isComplete ? 'rgba(34,197,94,0.4)' : isRunning ? 'rgba(255,102,0,0.3)' : 'rgba(255,26,26,0.25)'

  return (
    <div className="min-h-screen text-white overflow-x-hidden selection:bg-red-500" style={{ background: '#020202', fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Grid overlay */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      {/* Glow orb */}
      <div className="fixed pointer-events-none z-0" style={{ width: '600px', height: '600px', top: '-100px', left: '50%', transform: 'translateX(-50%)', background: `radial-gradient(circle, ${glowColor}, transparent 70%)`, transition: 'background 1s ease' }} />

      {/* HEADER */}
      <motion.header className="sticky top-0 z-50 px-6 h-20 flex items-center justify-between relative" style={{ background: 'rgba(2,2,2,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,26,26,0.08)' }} initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,26,26,0.45), transparent)' }} />
        <div className="flex items-center gap-5 relative z-10">
          <motion.button onClick={() => navigate('/dashboard')} className="p-3 rounded-xl border transition-all" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <ArrowLeft size={18} className="text-zinc-500" />
          </motion.button>
          <div>
            <h1 className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              <Timer style={{ color: '#ff1a1a', filter: 'drop-shadow(0 0 8px rgba(255,26,26,0.7))' }} size={22} /> REST_TIMER
            </h1>
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase mt-0.5" style={{ color: isComplete ? '#22c55e' : isRunning ? '#ff6600' : '#ff4444', fontFamily: 'JetBrains Mono, monospace' }}>
              {isComplete ? '✓ RECOVERY COMPLETE' : isRunning ? '◉ RESTING...' : '○ STANDBY'}
            </p>
          </div>
        </div>
        <motion.button onClick={() => setSoundEnabled(s => !s)} className="p-3 rounded-xl border transition-all relative z-10" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          {soundEnabled ? <Volume2 size={18} style={{ color: '#ff1a1a' }} /> : <VolumeX size={18} className="text-zinc-600" />}
        </motion.button>
      </motion.header>

      <div className="max-w-2xl mx-auto px-6 py-10 relative z-10 space-y-6">

        {/* MAIN TIMER GAUGE */}
        <motion.div className="rounded-3xl p-8 flex flex-col items-center relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          {/* Corner accents */}
          {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
            <div key={i} className={`absolute ${pos} w-6 h-6 pointer-events-none`} style={{ borderColor: 'rgba(255,26,26,0.2)', borderStyle: 'solid', borderWidth: `${i<2?'2px':'0'} ${i%2===1?'2px':'0'} ${i>=2?'2px':'0'} ${i%2===0?'2px':'0'}` }} />
          ))}

          {/* SVG Ring */}
          <div className="relative">
            <svg width="300" height="300" viewBox="0 0 300 300">
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              {/* Track */}
              <circle cx="150" cy="150" r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="14" />
              {/* Progress */}
              <motion.circle
                cx="150" cy="150" r={radius}
                fill="none"
                stroke={activeColor}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={circ}
                animate={{ strokeDashoffset: dashOffset, stroke: activeColor }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                transform="rotate(-90 150 150)"
                filter="url(#glow)"
              />
              {/* Tick marks */}
              {Array.from({ length: 60 }).map((_, i) => {
                const angle = (i / 60) * 2 * Math.PI - Math.PI / 2
                const inner = radius - 18, outer = radius - 10
                return (
                  <line key={i} x1={150 + inner * Math.cos(angle)} y1={150 + inner * Math.sin(angle)} x2={150 + outer * Math.cos(angle)} y2={150 + outer * Math.sin(angle)} stroke={i % 5 === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'} strokeWidth={i % 5 === 0 ? 1.5 : 0.8} />
                )
              })}
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                {isComplete ? (
                  <motion.div key="complete" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="text-center">
                    <div className="text-5xl mb-2">✓</div>
                    <p className="text-xl font-black uppercase tracking-widest" style={{ color: '#22c55e', fontFamily: 'JetBrains Mono, monospace' }}>REST DONE</p>
                  </motion.div>
                ) : (
                  <motion.div key="timer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                    <motion.p className="text-6xl font-black italic leading-none" style={{ fontFamily: 'JetBrains Mono, monospace', color: activeColor, filter: `drop-shadow(0 0 20px ${activeColor})` }} animate={{ scale: isRunning && time <= 10 ? [1, 1.05, 1] : 1 }} transition={{ duration: 0.5, repeat: isRunning && time <= 10 ? Infinity : 0 }}>
                      {formatTime(time)}
                    </motion.p>
                    <p className="text-[10px] font-bold tracking-[0.3em] uppercase mt-2 text-zinc-600" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {preset > 0 ? `${Math.round((1 - progress) * 100)}% complete` : 'SET TIME'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Time adjust */}
          <div className="flex items-center gap-5 mt-4">
            <motion.button onClick={() => adjustTime(-10)} disabled={isRunning} className="w-12 h-12 rounded-xl border flex items-center justify-center transition-all disabled:opacity-30" style={{ background: 'rgba(255,26,26,0.08)', borderColor: 'rgba(255,26,26,0.2)' }} whileHover={{ scale: isRunning ? 1 : 1.1 }} whileTap={{ scale: isRunning ? 1 : 0.9 }}>
              <Minus size={18} style={{ color: '#ff4444' }} />
            </motion.button>
            <p className="text-[9px] font-black tracking-widest text-zinc-700 uppercase">ADJUST 10s</p>
            <motion.button onClick={() => adjustTime(10)} disabled={isRunning} className="w-12 h-12 rounded-xl border flex items-center justify-center transition-all disabled:opacity-30" style={{ background: 'rgba(255,26,26,0.08)', borderColor: 'rgba(255,26,26,0.2)' }} whileHover={{ scale: isRunning ? 1 : 1.1 }} whileTap={{ scale: isRunning ? 1 : 0.9 }}>
              <Plus size={18} style={{ color: '#ff4444' }} />
            </motion.button>
          </div>

          {/* Control buttons */}
          <div className="flex gap-4 mt-6 w-full">
            <motion.button onClick={handleStart} className="flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all" style={{ background: isComplete ? '#22c55e' : 'linear-gradient(135deg, #ff1a1a, #cc0000)', boxShadow: `0 0 30px ${activeColor}40` }} whileHover={{ scale: 1.02, boxShadow: `0 0 40px ${activeColor}60` }} whileTap={{ scale: 0.98 }}>
              {isComplete ? <><RotateCcw size={18} /> RESTART</> : isRunning ? <><Pause size={18} /> PAUSE</> : <><Play size={18} /> START</>}
            </motion.button>
            <motion.button onClick={handleReset} className="px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 border transition-all" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }} whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.05)' }} whileTap={{ scale: 0.95 }}>
              <RotateCcw size={18} className="text-zinc-500" />
            </motion.button>
          </div>
        </motion.div>

        {/* PROTOCOL CARDS */}
        <motion.div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center gap-2 mb-4">
            <Zap size={14} style={{ color: '#ff1a1a' }} />
            <p className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>TRAINING PROTOCOLS</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {PROTOCOLS.map(p => (
              <motion.button key={p.label} onClick={() => handleProtocol(p)} disabled={isRunning} className="p-3 rounded-xl border text-left transition-all disabled:opacity-40" style={{ background: selectedProtocol === p.label ? `${p.color}15` : 'rgba(255,255,255,0.02)', borderColor: selectedProtocol === p.label ? `${p.color}40` : 'rgba(255,255,255,0.05)', boxShadow: selectedProtocol === p.label ? `0 0 15px ${p.color}20` : 'none' }} whileHover={{ scale: isRunning ? 1 : 1.03 }} whileTap={{ scale: isRunning ? 1 : 0.97 }}>
                <div className="text-lg font-black italic" style={{ color: p.color, fontFamily: 'JetBrains Mono, monospace', filter: selectedProtocol === p.label ? `drop-shadow(0 0 6px ${p.color})` : 'none' }}>{p.seconds}s</div>
                <div className="text-[8px] font-black uppercase tracking-widest mt-1" style={{ color: selectedProtocol === p.label ? p.color : '#52525b' }}>{p.label}</div>
                <div className="text-[7px] text-zinc-700 mt-0.5">{p.desc}</div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* REST GUIDELINES */}
        <motion.div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-600 mb-4" style={{ fontFamily: 'JetBrains Mono, monospace' }}>REST SCIENCE</p>
          <div className="space-y-2">
            {[
              { color: '#ff1a1a', label: 'STRENGTH', value: '2–3 MIN', desc: 'CNS recovery for max force output' },
              { color: '#ff6600', label: 'HYPERTROPHY', value: '60–90 SEC', desc: 'Metabolic stress + mechanical tension' },
              { color: '#22c55e', label: 'ENDURANCE', value: '30–60 SEC', desc: 'Cardiovascular adaptation' },
              { color: '#a855f7', label: 'POWER/EXPLOSIVE', value: '3–5 MIN', desc: 'Full ATP-PC system replenishment' },
            ].map(g => (
              <div key={g.label} className="flex items-center justify-between p-3 rounded-xl border" style={{ background: `${g.color}06`, borderColor: `${g.color}15` }}>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: g.color }}>{g.label}</p>
                  <p className="text-[8px] text-zinc-600 mt-0.5">{g.desc}</p>
                </div>
                <p className="font-black text-sm italic" style={{ color: g.color, fontFamily: 'JetBrains Mono, monospace' }}>{g.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default RestTimer
