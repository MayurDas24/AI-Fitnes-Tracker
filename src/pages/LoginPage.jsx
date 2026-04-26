import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowRight, Lock, User, Zap, AlertTriangle, ChevronLeft, Loader2 } from 'lucide-react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { login, signup, clearUserData } from '../services/api'
import toast from 'react-hot-toast'

// --- 1. THE WARP ENGINE ---
const WarpBackground = ({ warpState }) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animationFrameId
    let lastTime = 0
    const fps = 30
    const interval = 1000 / fps
    
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)
    resize()

    const stars = Array.from({ length: 500 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random() * 2,
      size: Math.random() * 2
    }))

    const render = (currentTime) => {
      if (currentTime - lastTime >= interval) {
        if (warpState === 'idle') {
          ctx.fillStyle = 'rgba(0, 0, 0, 1)'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        } else {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }

        const cx = canvas.width / 2
        const cy = canvas.height / 2

        let speed = 0.2
        if (warpState === 'forward') speed = 50
        if (warpState === 'reverse') speed = -30

        stars.forEach(star => {
          const dx = (star.x - cx) / canvas.width
          const dy = (star.y - cy) / canvas.height
          
          star.x += dx * speed * star.z
          star.y += dy * speed * star.z
          
          if (warpState !== 'reverse') {
              if (star.x < 0 || star.x > canvas.width || star.y < 0 || star.y > canvas.height) {
                  star.x = cx + (Math.random() - 0.5) * 20
                  star.y = cy + (Math.random() - 0.5) * 20
                  if (warpState === 'idle') {
                      star.x = Math.random() * canvas.width
                      star.y = Math.random() * canvas.height
                  }
              }
          } else {
              const dist = Math.sqrt((star.x - cx)**2 + (star.y - cy)**2)
              if (dist < 5) {
                  star.x = Math.random() * canvas.width
                  star.y = Math.random() * canvas.height
                  if (Math.random() > 0.5) star.x = star.x > cx ? canvas.width : 0
                  else star.y = star.y > cy ? canvas.height : 0
              }
          }

          const size = (warpState !== 'idle') ? star.size * 3 : star.size
          let color = `rgba(255, 255, 255, ${Math.random()})`
          
          if (warpState === 'forward') color = `rgba(100, 200, 255, 0.8)`
          if (warpState === 'reverse') color = `rgba(255, 50, 50, 0.8)`

          ctx.beginPath()
          if (warpState !== 'idle') {
              ctx.moveTo(star.x, star.y)
              ctx.lineTo(star.x - (dx * 30), star.y - (dy * 30))
              ctx.strokeStyle = color
              ctx.lineWidth = size
              ctx.stroke()
          } else {
              ctx.fillStyle = color
              ctx.arc(star.x, star.y, size, 0, Math.PI * 2)
              ctx.fill()
          }
        })

        lastTime = currentTime
      }
      animationFrameId = requestAnimationFrame(render)
    }
    render()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [warpState])

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />
}

// --- 2. HACKER TEXT ---
const HackerText = ({ text, className }) => {
  const [displayText, setDisplayText] = useState(text)
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&"

  const scramble = () => {
    let iteration = 0
    const interval = setInterval(() => {
      setDisplayText(text.split("").map((l, i) => {
          if (i < iteration) return text[i]
          return chars[Math.floor(Math.random() * chars.length)]
        }).join(""))
      if (iteration >= text.length) clearInterval(interval)
      iteration += 1 / 3
    }, 30)
  }

  return (
    <span onMouseEnter={scramble} className={`cursor-default ${className}`}>
      {displayText}
    </span>
  )
}

// --- 3. MAIN COMPONENT ---
function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [warpState, setWarpState] = useState('idle')
  const [formData, setFormData] = useState({ email: '', password: '', name: '' })
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false)
  const [pendingLogin, setPendingLogin] = useState(null)
  const [errors, setErrors] = useState({ email: '', password: '', name: '' })
  
  const [windowSize, setWindowSize] = useState({ 
    width: window.innerWidth, 
    height: window.innerHeight 
  })

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get('token')
    const user = params.get('user')
    const error = params.get('error')

    if (error) {
      toast.error('Google authentication failed')
      return
    }

    if (token && user) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(user))
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(parsedUser))
        toast.success('Logged in with Google! 🎉')
        setWarpState('forward')
        setTimeout(() => navigate('/dashboard'), 1500)
      } catch (e) {
        console.error('Failed to parse user:', e)
        toast.error('Authentication error. Please try again.')
      }
    }
  }, [location, navigate])

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useTransform(mouseY, [0, windowSize.height], [5, -5])
  const rotateY = useTransform(mouseX, [0, windowSize.width], [-5, 5])

  const handleMove = (e) => {
    mouseX.set(e.clientX)
    mouseY.set(e.clientY)
  }

  const validateForm = () => {
    if (!isSignup && requiresTwoFactor) {
      const newErrors = {}
      if (!/^\d{6}$/.test(twoFactorCode)) {
        newErrors.twoFactor = 'Enter valid 6-digit code'
      }
      setErrors(prev => ({ ...prev, twoFactor: newErrors.twoFactor || '' }))
      return Object.keys(newErrors).length === 0
    }

    const newErrors = {}
    if (!formData.email) {
      newErrors.email = 'Email required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid format'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password required'
    } else if (formData.password.length < 6) {
      newErrors.password = '6+ characters required'
    }
    
    if (isSignup && !formData.name) {
      newErrors.name = 'Name required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    
    setLoading(true)
    setWarpState('forward')

    try {
      if (isSignup) {
        const data = await signup(formData.name, formData.email, formData.password)
        if (data.token) {
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user || { email: formData.email, name: formData.name }))
          toast.success('Account created! 🎉')
          setTimeout(() => navigate('/dashboard'), 1500)
        } else {
          toast.error(data.message || 'Signup failed')
          setWarpState('idle')
          setLoading(false)
        }
      } else {
        const loginEmail = requiresTwoFactor ? pendingLogin?.email : formData.email
        const loginPassword = requiresTwoFactor ? pendingLogin?.password : formData.password

        const data = await login(loginEmail, loginPassword, requiresTwoFactor ? twoFactorCode : undefined)

        if (data.requiresTwoFactor) {
          setPendingLogin({ email: formData.email, password: formData.password })
          setRequiresTwoFactor(true)
          setWarpState('idle')
          setLoading(false)
          toast('Enter 6-digit code from your authenticator app', { icon: '🛡️' })
          return
        }

        if (data.token) {
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user || { email: formData.email }))
          toast.success('Welcome back! 💪')
          setTimeout(() => navigate('/dashboard'), 1500)
        } else {
          toast.error(data.message || 'Login failed')
          setWarpState('idle')
          setLoading(false)
        }
      }
    } catch {
      toast.error('Connection error. Is backend running?')
      setWarpState('idle')
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    const apiBase = rawApiUrl.replace(/\/api\/?$/, '')
    const frontendOrigin = window.location.origin
    window.location.href = `${apiBase}/api/auth/google?frontend=${encodeURIComponent(frontendOrigin)}`
  }

  const handleAbort = () => {
    setWarpState('reverse')
    setTimeout(() => navigate('/'), 1500)
  }

  const toggleMode = () => {
    setIsSignup(!isSignup)
    setErrors({ email: '', password: '', name: '', twoFactor: '' })
    setRequiresTwoFactor(false)
    setPendingLogin(null)
    setTwoFactorCode('')
  }

  return (
    <div 
        className="min-h-screen bg-black flex items-center justify-center overflow-x-hidden overflow-y-auto px-4 py-8 sm:px-6 sm:py-12 perspective-1000 selection:bg-red-500 selection:text-white"
        onMouseMove={handleMove}
    >
      <WarpBackground warpState={warpState} />
      
      {/* HUD OVERLAY */}
      <div className={`fixed inset-0 z-10 pointer-events-none transition-colors duration-500 ${warpState === 'reverse' ? 'bg-red-900/20' : 'bg-[radial-gradient(circle_at_center,transparent_0%,black_120%)]'}`} />

      {/* ABORT BUTTON */}
      <motion.button
        onClick={handleAbort}
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        whileHover={{ x: 10, scale: 1.05 }}
        className="fixed top-5 left-4 z-50 group"
      >
        <div className="bg-zinc-900/90 border-r-4 border-yellow-500 text-white pl-8 pr-6 py-3 flex items-center gap-3 shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_40px_rgba(220,38,38,0.5)] hover:border-red-600 transition-all duration-300">
            <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)]" />
            <ChevronLeft className="group-hover:-translate-x-1 transition-transform text-gray-500 group-hover:text-red-500" />
            <div className="flex flex-col items-start">
                <span className="text-[10px] font-black text-yellow-500 group-hover:text-red-500 tracking-[0.2em] uppercase leading-none mb-1">
                    Emergency
                </span>
                <span className="text-sm font-bold tracking-widest text-white group-hover:text-red-100">
                    ABORT MISSION
                </span>
            </div>
            <AlertTriangle className="text-yellow-500 group-hover:text-red-600 animate-pulse ml-2" size={18} />
        </div>
      </motion.button>

      {/* MAIN HUD CARD */}
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        animate={
            warpState === 'forward' ? { scale: [1, 0.1], opacity: 0, rotateZ: 45 } : 
            warpState === 'reverse' ? { scale: [1, 1.2], opacity: 0, x: [0, -50, 50, 0] } :
            { scale: 1, opacity: 1 }
        }
        transition={{ duration: warpState === 'idle' ? 0.5 : 1.5 }}
        className="relative z-20 w-full max-w-[480px] p-5 sm:p-6 md:p-7"
      >
        <div className="absolute inset-0 border border-white/20 rounded-2xl bg-black/45 backdrop-blur-lg shadow-[0_0_50px_rgba(255,255,255,0.05)]" />
        
        {/* CORNER ACCENTS */}
        <div className="absolute -top-2 -left-2 w-8 h-8 border-t-2 border-l-2 border-red-600" />
        <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-2 border-r-2 border-red-600" />

        <div className="relative z-10 w-full flex flex-col items-center gap-5 sm:gap-6">

          <div className="relative">
                <div className="absolute inset-0 bg-red-500 blur-2xl opacity-20 animate-pulse" />
            <Zap size={42} className="text-white relative z-10" />
          </div>

          <div className="w-full text-center space-y-2">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                <HackerText text={isSignup ? "SIGNUP_PROTOCOL" : "SYSTEM_LOGIN"} />
            </h2>
            <p className="text-[10px] text-red-500 font-mono tracking-[0.28em]">
                {isSignup ? 'NEW IDENTITY // CLASS 4' : 'RESTRICTED AREA // CLASS 4'}
            </p>
          </div>

            {/* Google Button */}
            <button
              onClick={handleGoogleLogin}
              className="w-full h-12 bg-white text-gray-900 hover:bg-gray-100 font-black text-xs uppercase tracking-[0.14em] rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              CONTINUE WITH GOOGLE
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 w-full">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-zinc-600 font-black text-xs uppercase tracking-widest">OR</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
                
                {isSignup && (
                  <div className="relative group">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" size={20} />
                      <input 
                          type="text" 
                          placeholder="FULL_NAME"
                          value={formData.name}
                          onChange={e => {
                            setFormData({...formData, name: e.target.value})
                            setErrors({...errors, name: ''})
                          }}
                                className={`w-full h-14 rounded-md bg-white/5 border-l-2 ${errors.name ? 'border-red-500' : 'border-white/10'} pl-14 pr-5 text-white placeholder-gray-600 outline-none focus:bg-white/10 focus:border-red-600 transition-all font-mono text-[15px] tracking-[0.13em]`}
                      />
                      {errors.name && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-[10px] mt-1 font-mono uppercase tracking-widest">{errors.name}</motion.p>
                      )}
                  </div>
                )}

                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" size={20} />
                    <input 
                        type="email" 
                        placeholder="IDENTIFIER"
                        value={formData.email}
                        onChange={e => {
                          setFormData({...formData, email: e.target.value})
                          setErrors({...errors, email: ''})
                        }}
                        className={`w-full h-14 rounded-md bg-white/5 border-l-2 ${errors.email ? 'border-red-500' : 'border-white/10'} pl-14 pr-5 text-white placeholder-gray-600 outline-none focus:bg-white/10 focus:border-red-600 transition-all font-mono text-[15px] tracking-[0.13em]`}
                    />
                    {errors.email && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-[10px] mt-1 font-mono uppercase tracking-widest">{errors.email}</motion.p>
                    )}
                </div>

                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" size={20} />
                    <input 
                        type="password" 
                        placeholder="SECURITY_KEY"
                        value={formData.password}
                        onChange={e => {
                          setFormData({...formData, password: e.target.value})
                          setErrors({...errors, password: ''})
                        }}
                        className={`w-full h-14 rounded-md bg-white/5 border-l-2 ${errors.password ? 'border-red-500' : 'border-white/10'} pl-14 pr-5 text-white placeholder-gray-600 outline-none focus:bg-white/10 focus:border-red-600 transition-all font-mono text-[15px] tracking-[0.13em]`}
                    />
                    {errors.password && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-[10px] mt-1 font-mono uppercase tracking-widest">{errors.password}</motion.p>
                    )}
                </div>

                {!isSignup && requiresTwoFactor && (
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" size={20} />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="2FA_CODE"
                      value={twoFactorCode}
                      onChange={e => {
                        setTwoFactorCode(e.target.value.replace(/\D/g, ''))
                        setErrors({ ...errors, twoFactor: '' })
                      }}
                      className={`w-full h-14 rounded-md bg-white/5 border-l-2 ${errors.twoFactor ? 'border-red-500' : 'border-white/10'} pl-14 pr-5 text-white placeholder-gray-600 outline-none focus:bg-white/10 focus:border-red-600 transition-all font-mono text-[15px] tracking-[0.13em]`}
                    />
                    {errors.twoFactor && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-[10px] mt-1 font-mono uppercase tracking-widest">{errors.twoFactor}</motion.p>
                    )}
                  </div>
                )}

                <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="w-full h-14 bg-white text-black font-black mt-2 uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-red-600 hover:text-white transition-all duration-300 relative group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        {loading ? (
                          <><Loader2 className="animate-spin" size={18} /> {isSignup ? 'CREATING...' : (requiresTwoFactor ? 'VERIFYING...' : 'INITIALIZING...')}</>
                        ) : (
                          <>{isSignup ? 'CREATE_IDENTITY' : (requiresTwoFactor ? 'VERIFY_CODE' : 'INITIALIZE')} <ArrowRight size={18} /></>
                        )}
                    </span>
                    <div className="absolute inset-0 bg-red-700 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </motion.button>
            </form>

            <div className="w-full pt-1 flex justify-between text-[10px] text-gray-500 font-mono uppercase">
                <button 
                  onClick={toggleMode} 
                  className="hover:text-red-500 transition-colors"
                >
                  {isSignup ? '← BACK TO LOGIN' : 'CREATE_ACCOUNT'}
                </button>
                <button 
                  onClick={() => {
                    setWarpState('forward')
                    clearUserData()
                    localStorage.setItem('token', 'demo-token-skip-auth')
                    localStorage.setItem('user', JSON.stringify({
                      id: 'demo-user',
                      name: 'Demo User',
                      email: 'demo@fittracker.app',
                      profileData: {}
                    }))
                    toast.success('Entered demo mode')
                    setTimeout(() => navigate('/dashboard'), 400)
                  }} 
                  className="hover:text-red-500 transition-colors"
                >
                  SKIP_AUTH
                </button>
            </div>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginPage