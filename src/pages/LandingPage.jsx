import React, { useEffect, useRef, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Play, Zap, Activity } from 'lucide-react'

// --- CURSOR: NO transition, NO shadow = ZERO LAG ---
const CustomCursor = () => {
  const cursorRef = useRef(null)

  useEffect(() => {
    const cursor = cursorRef.current
    if (!cursor) return

    const isDesktop = window.matchMedia('(min-width: 768px) and (pointer: fine)').matches
    if (!isDesktop) {
      cursor.style.display = 'none'
      return
    }

    const onMouseMove = (e) => {
      cursor.style.transform = `translate(${e.clientX - 12}px, ${e.clientY - 12}px)`
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [])

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 w-6 h-6 pointer-events-none z-[100]"
      style={{ willChange: 'transform', transform: 'translate(-100px, -100px)' }}
    >
      <div className="w-full h-full bg-white rounded-full" />
    </div>
  )
}

// --- SPOTLIGHT CARD ---
const SpotlightCard = memo(({ children, className = "" }) => {
  const cardRef = useRef(null)
  const rafRef = useRef()

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const rect = cardRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      cardRef.current.style.setProperty('--x', `${x}%`)
      cardRef.current.style.setProperty('--y', `${y}%`)
    })
  }, [])

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  return (
    <div
      ref={cardRef}
      className={`group relative border border-white/10 bg-zinc-900/80 overflow-hidden transition-all duration-300 hover:border-red-600/30 hover:shadow-2xl hover:shadow-red-600/10 ${className}`}
      onMouseMove={handleMouseMove}
      style={{ '--x': '50%', '--y': '50%' }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(600px circle at var(--x) var(--y), rgba(220, 38, 38, 0.15), transparent 40%)` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />
      <div className="relative h-full z-10">{children}</div>
    </div>
  )
})
SpotlightCard.displayName = 'SpotlightCard'

// --- STATS BAR ---
const StatBar = memo(({ label, val }) => {
  const [width, setWidth] = React.useState(0)
  const barRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setWidth(val)
          observer.disconnect()
        }
      })
    }, { threshold: 0.1 })
    if (barRef.current) observer.observe(barRef.current)
    return () => observer.disconnect()
  }, [val])

  return (
    <div ref={barRef} className="group/bar">
      <div className="flex justify-between text-xs font-mono text-zinc-500 mb-2">
        <span>{label}</span>
        <span className="text-white/80">{val}%</span>
      </div>
      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-white to-red-400 group-hover/bar:from-red-500 group-hover/bar:to-red-300 transition-all duration-1000 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
})
StatBar.displayName = 'StatBar'

const statsData = [
  { label: 'HYPERTROPHY', val: 92 },
  { label: 'RECOVERY', val: 64 },
  { label: 'INTENSITY', val: 88 }
]

const NoiseTexture = memo(() => (
  <div
    className="fixed inset-0 z-50 pointer-events-none opacity-[0.02]"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
      backgroundSize: '128px 128px',
    }}
  />
))
NoiseTexture.displayName = 'NoiseTexture'

function LandingPage() {
  const navigate = useNavigate()
  const handleLogin = useCallback(() => navigate('/login'), [navigate])

  return (
    <div className="bg-black text-white min-h-screen selection:bg-red-600 selection:text-black font-sans overflow-x-hidden">
      <CustomCursor />
      <NoiseTexture />

      {/* Ambient Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-red-800/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-40 px-6 md:px-10 py-8 flex justify-between items-center mix-blend-difference">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
          <span className="text-xl font-bold tracking-tighter">AI.FIT</span>
        </div>
        <button
          onClick={handleLogin}
          className="text-xs md:text-sm font-medium uppercase tracking-widest hover:text-red-500 transition-colors"
        >
          [ Login ]
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-between items-center overflow-hidden py-24 md:py-32">
        <h1 className="relative z-10 text-[18vw] md:text-[14vw] leading-none font-black tracking-tighter text-transparent select-none bg-clip-text bg-gradient-to-b from-white to-zinc-600">
          DEFINE
        </h1>

        {/* Center Card */}
        <div className="relative z-20 w-[300px] h-[400px] md:w-[350px] md:h-[450px] my-8">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-red-600/20 blur-[100px] rounded-full animate-pulse pointer-events-none" />
          <div className="relative w-full h-full bg-zinc-900/90 border border-white/10 rounded-[30px] overflow-hidden flex flex-col items-center justify-between p-8 shadow-2xl shadow-black backdrop-blur-sm">
            <div className="w-full flex justify-between items-center border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                <span className="text-[10px] font-mono text-gray-400">LIVE FEED</span>
              </div>
              <Zap size={16} className="text-white" />
            </div>
            <div className="flex-1 flex items-center justify-center">
              <Activity size={80} className="text-white opacity-80" strokeWidth={1} />
            </div>
            <div className="w-full grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div>
                <p className="text-[10px] text-gray-500 font-mono">HRV</p>
                <p className="text-xl font-bold text-white">42<span className="text-xs text-gray-500 ml-1">ms</span></p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 font-mono">LOAD</p>
                <p className="text-xl font-bold text-white">98<span className="text-xs text-gray-500 ml-1">%</span></p>
              </div>
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_2px] pointer-events-none z-50 mix-blend-overlay" />
          </div>
        </div>

        <h1
          className="relative z-10 text-[18vw] md:text-[14vw] leading-none font-black tracking-tighter text-transparent select-none"
          style={{ WebkitTextStroke: '1px rgba(255,255,255,0.5)' }}
        >
          LIMITS
        </h1>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 mix-blend-screen">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">Scroll</p>
          <div className="w-[1px] h-8 bg-gradient-to-b from-white/50 to-transparent animate-pulse" />
        </div>
      </section>

      {/* Content Grid */}
      <section className="relative z-20 px-4 md:px-10 pb-32 pt-10 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">

          {/* Card 1 */}
          <div className="col-span-1 md:col-span-8 h-[350px] md:h-[450px]">
            <SpotlightCard className="h-full rounded-3xl p-6 md:p-10 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <Activity className="text-red-500" size={32} />
                  <span className="text-xs font-mono text-zinc-500 border border-zinc-800 px-2 py-1 rounded">V.2.0.1</span>
                </div>
                <h3 className="text-2xl md:text-4xl font-medium tracking-tight mb-3">Neural Tracking.</h3>
                <p className="text-zinc-400 max-w-lg text-base md:text-lg leading-relaxed">
                  Our AI doesn't just count reps. It analyzes biomechanics in real-time, adjusting load and volume dynamically.
                </p>
              </div>
              <div className="flex justify-end">
                <button className="rounded-full w-12 h-12 border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-colors">
                  <ArrowUpRight size={20} />
                </button>
              </div>
            </SpotlightCard>
          </div>

          {/* Card 2 */}
          <div className="col-span-1 md:col-span-4 h-[350px] md:h-[450px]">
            <SpotlightCard className="h-full rounded-3xl p-6 md:p-8 relative flex flex-col">
              <h3 className="text-xl md:text-2xl font-medium mb-6">Live Analytics</h3>
              <div className="space-y-4 flex-1">
                {statsData.map((stat, i) => (
                  <StatBar key={i} label={stat.label} val={stat.val} />
                ))}
              </div>
              <div className="mt-auto pt-6 border-t border-white/5">
                <p className="text-xs text-zinc-500">Processing real-time user data...</p>
              </div>
            </SpotlightCard>
          </div>

          {/* Card 3 - CTA */}
          <div className="col-span-1 md:col-span-12 h-[250px] md:h-[300px] mt-4 md:mt-6">
            <div
              onClick={handleLogin}
              className="relative h-full rounded-3xl overflow-hidden bg-gradient-to-br from-red-600/10 to-transparent border border-white/10 flex items-center justify-center group cursor-pointer"
            >
              <div className="absolute inset-0 flex items-center justify-center leading-none select-none pointer-events-none">
                <div className="flex whitespace-nowrap text-[6rem] md:text-[10rem] font-black text-white/5 animate-marquee">
                  START NOW START NOW START NOW START NOW
                </div>
              </div>
              <div className="relative z-10 text-center px-4">
                <h2 className="text-3xl md:text-5xl lg:text-7xl font-black italic tracking-tighter mb-4 mix-blend-overlay group-hover:mix-blend-normal transition-all">
                  JOIN THE ELITE
                </h2>
                <button className="bg-red-600 hover:bg-red-700 text-white px-6 md:px-10 py-3 md:py-4 rounded-full font-bold uppercase tracking-widest text-xs md:text-sm flex items-center gap-2 md:gap-3 mx-auto shadow-lg shadow-red-600/30 transition-transform group-hover:scale-105">
                  <Play size={16} fill="currentColor" /> Initialize
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 md:py-12 px-6 md:px-10 flex flex-col md:flex-row justify-between items-end bg-black relative z-10">
        <div>
          <h1 className="text-[10vw] md:text-[8vw] leading-none font-black text-zinc-900 select-none">AI.FIT</h1>
        </div>
        <div className="flex gap-4 md:gap-8 text-[10px] md:text-xs uppercase tracking-widest text-zinc-500 mb-2 md:mb-6">
          {['Instagram', 'Twitter', 'Support'].map((item) => (
            <a key={item} href="#" className="hover:text-red-500 transition-colors">{item}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
