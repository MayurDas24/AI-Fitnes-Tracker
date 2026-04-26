import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Component, Suspense, lazy, useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import { isAuthenticated } from './services/api'
import { ThemeProvider } from './context/ThemeContext'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const CalculatorPage = lazy(() => import('./pages/CalculatorPage'))
const WorkoutTracker = lazy(() => import('./pages/WorkoutTracker'))
const DietTracker = lazy(() => import('./pages/DietTracker'))
const ExerciseLibrary = lazy(() => import('./pages/ExerciseLibrary'))
const ProgressPage = lazy(() => import('./pages/ProgressPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const WaterTracker = lazy(() => import('./pages/WaterTracker'))
const RestTimer = lazy(() => import('./pages/RestTimer'))
const WorkoutPlanGenerator = lazy(() => import('./pages/WorkoutPlanGenerator'))
const BodyAnalysis = lazy(() => import('./pages/BodyAnalysis'))
const AIAssistant = lazy(() => import('./pages/AIAssistant'))
const AuthCallback = lazy(() => import('./pages/AuthCallback'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen min-vh-100 bg-black d-flex align-items-center justify-content-center p-6 p-4">
          <div className="bg-zinc-900 card border border-danger border-2 rounded-2xl p-8 max-w-md text-center">
            <AlertTriangle className="text-red-600 mx-auto mb-4 animate-pulse" size={64} />
            <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">
              SYSTEM ERROR
            </h1>
            <p className="text-gray-400 mb-4 text-sm">
              Something went wrong. The application encountered an unexpected error.
            </p>
            <div className="bg-black/50 p-3 rounded-xl mb-6 text-left">
              <p className="text-xs text-red-500 font-mono break-all">
                {this.state.error?.toString()}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-danger bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl uppercase tracking-wider transition-colors w-full"
            >
              Reload Application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const routeStackRef = useRef([])

  useEffect(() => {
    const currentRoute = `${location.pathname}${location.search}${location.hash}`
    const stack = routeStackRef.current
    const lastRoute = stack[stack.length - 1]

    if (lastRoute !== currentRoute) {
      stack.push(currentRoute)
    }
  }, [location.pathname, location.search, location.hash])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return

      const target = event.target
      if (target instanceof HTMLElement) {
        const tag = target.tagName
        const isTypingField =
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          target.isContentEditable

        if (isTypingField) return
      }

      const stack = routeStackRef.current
      if (stack.length > 1) {
        stack.pop()
        const previousRoute = stack[stack.length - 1]
        if (previousRoute) {
          navigate(previousRoute)
          return
        }
      }

      navigate(-1)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate])

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #333',
            },
            success: {
              icon: '✅',
              style: {
                border: '1px solid #22c55e',
              },
            },
            error: {
              icon: '❌',
              style: {
                border: '1px solid #ef4444',
              },
            },
          }}
        />
        <Suspense fallback={
          <div className="min-h-screen min-vh-100 bg-black d-flex align-items-center justify-content-center">
            <div className="spinner-border text-danger" role="status" aria-hidden="true" />
          </div>
        }>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/calculator" element={<ProtectedRoute><CalculatorPage /></ProtectedRoute>} />
            <Route path="/workout" element={<ProtectedRoute><WorkoutTracker /></ProtectedRoute>} />
            <Route path="/diet" element={<ProtectedRoute><DietTracker /></ProtectedRoute>} />
            <Route path="/exercises" element={<ProtectedRoute><ExerciseLibrary /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/water" element={<ProtectedRoute><WaterTracker /></ProtectedRoute>} />
            <Route path="/timer" element={<ProtectedRoute><RestTimer /></ProtectedRoute>} />
            <Route path="/workout-plan" element={<ProtectedRoute><WorkoutPlanGenerator /></ProtectedRoute>} />
            <Route path="/body-analysis" element={<ProtectedRoute><BodyAnalysis /></ProtectedRoute>} />
            <Route path="/ai" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
