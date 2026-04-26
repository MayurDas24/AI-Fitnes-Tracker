import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { clearUserData } from '../services/api'

const AuthCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    const userRaw = searchParams.get('user')

    if (token && userRaw) {
      try {
        let user
        try {
          user = JSON.parse(userRaw)
        } catch {
          user = JSON.parse(decodeURIComponent(userRaw))
        }
        clearUserData()
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        toast.success(`Welcome, ${user.name || 'back'}!`)
        navigate('/dashboard', { replace: true })
      } catch (err) {
        console.error('Auth callback parse error:', err)
        toast.error('Google login failed. Please try again.')
        navigate('/login', { replace: true })
      }
    } else {
      toast.error('Invalid auth callback. Please try again.')
      navigate('/login', { replace: true })
    }
  }, [navigate, searchParams])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-center">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Completing sign in...</p>
      </div>
    </div>
  )
}

export default AuthCallback
