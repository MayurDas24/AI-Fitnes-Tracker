import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'

const GLITCH_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@%&$'

function GlitchNumber({ text }) {
  const [display, setDisplay] = useState(text)

  useEffect(() => {
    let iter = 0
    const iv = setInterval(() => {
      setDisplay(text.split('').map((c, i) => i < iter ? text[i] : GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]).join(''))
      if (iter >= text.length) clearInterval(iv)
      iter += 0.5
    }, 40)
    return () => clearInterval(iv)
  }, [text])

  return <span>{display}</span>
}

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div
      className="neo-brutal-page min-h-screen flex items-center justify-center p-6 selection:bg-red-500 overflow-hidden"
      style={{ background: '#020202', fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {/* Grid */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      {/* Red glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,26,26,0.04), transparent 60%)' }} />

      {/* Orbiting dots */}
      {[0,1,2,3,4,5].map(i => (
        <motion.div
          key={i}
          className="fixed w-1.5 h-1.5 rounded-full"
          style={{
            background: '#ff1a1a',
            boxShadow: '0 0 6px #ff1a1a',
            top: '50%', left: '50%',
          }}
          animate={{
            x: Math.cos(i * 60 * (Math.PI / 180)) * (150 + i * 30),
            y: Math.sin(i * 60 * (Math.PI / 180)) * (150 + i * 30),
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative text-center max-w-md w-full z-10"
      >
        <div className="rounded-2xl p-10 relative overflow-hidden" style={{ background: '#080808', border: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Corner accents */}
          <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-red-600/40" />
          <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-red-600/40" />
          <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-red-600/40" />
          <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-red-600/40" />
          {/* Animated top border */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,26,26,0.6), transparent)', boxShadow: '0 0 10px rgba(255,26,26,0.4)' }} />

          {/* Scanlines */}
          <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,26,26,0.015) 3px, rgba(255,26,26,0.015) 4px)' }} />

          {/* 404 */}
          <motion.div
            className="font-black italic leading-none select-none mb-6 tracking-tighter"
            style={{
              fontSize: '7rem',
              fontFamily: 'JetBrains Mono, monospace',
              color: '#ff1a1a',
              textShadow: '0 0 40px rgba(255,26,26,0.5), 0 0 80px rgba(255,26,26,0.2)',
            }}
            animate={{ textShadow: ['0 0 40px rgba(255,26,26,0.5)', '0 0 60px rgba(255,26,26,0.8)', '0 0 40px rgba(255,26,26,0.5)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <GlitchNumber text="404" />
          </motion.div>

          {/* Icon */}
          <div className="w-14 h-14 mx-auto mb-6 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,26,26,0.08)', border: '1px solid rgba(255,26,26,0.2)', boxShadow: '0 0 20px rgba(255,26,26,0.15)' }}>
            <Zap style={{ color: '#ff1a1a', filter: 'drop-shadow(0 0 6px rgba(255,26,26,0.8))' }} size={28} />
          </div>

          <h1 className="text-xl font-black uppercase italic tracking-tighter text-white mb-3" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            PAGE_NOT_FOUND
          </h1>
          <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-8 font-mono-forge">
            You wandered off the training plan.<br />This route doesn't exist.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: '#444', fontFamily: 'JetBrains Mono, monospace' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#444'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft size={13} /> GO_BACK
            </motion.button>
            <motion.button
              onClick={() => navigate('/dashboard')}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all"
              style={{ background: 'linear-gradient(135deg, #ff1a1a, #cc0000)', color: 'white', boxShadow: '0 0 20px rgba(255,26,26,0.4)', fontFamily: 'JetBrains Mono, monospace' }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <Home size={13} /> DASHBOARD
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}


