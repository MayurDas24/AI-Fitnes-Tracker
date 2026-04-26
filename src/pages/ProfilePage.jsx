import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Target,
  Activity,
  Ruler,
  Weight,
  Edit,
  Camera,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { changePassword, generate2FA, verify2FA, disable2FA } from '../services/api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const getToken = () => {
  const t = localStorage.getItem('token')
  return t && t !== 'null' && t !== 'undefined' && t !== 'demo-token-skip-auth' ? t : null
}

const DEFAULT_PROFILE = {
  name: '',
  email: '',
  avatar: '',
  phone: '',
  age: '',
  gender: 'Male',
  height: '',
  currentWeight: '',
  goalWeight: '',
  activityLevel: 'Moderate',
  fitnessGoal: 'General Fitness',
  joinDate: new Date().toISOString().split('T')[0],
}

function ProfilePage() {
  const navigate = useNavigate()
  const avatarInputRef = useRef(null)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [securityLoading, setSecurityLoading] = useState(false)
  const [securityModal, setSecurityModal] = useState(null)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorSetup, setTwoFactorSetup] = useState({ qrCode: '', secret: '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [profileData, setProfileData] = useState({ ...DEFAULT_PROFILE })
  const [tempData, setTempData] = useState({ ...DEFAULT_PROFILE })
  const [notificationSettings, setNotificationSettings] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('profileNotificationSettings') || 'null')
      if (saved) return saved
    } catch {
      // Ignore malformed localStorage payloads and fall back to defaults.
    }
    return {
      workoutReminders: true,
      progressReports: true,
      nutritionTips: false,
    }
  })

  useEffect(() => {
    const token = getToken()
    if (!token) {
      try {
        const saved = localStorage.getItem('userProfile')
        if (saved) {
          const parsed = JSON.parse(saved)
          const merged = { ...DEFAULT_PROFILE, ...parsed }
          setProfileData(merged)
          setTempData(merged)
        }
        const user = JSON.parse(localStorage.getItem('user') || 'null')
        if (user) {
          setProfileData((prev) => ({
            ...prev,
            name: user.name || prev.name,
            email: user.email || prev.email,
            avatar: user.profileData?.avatar || prev.avatar,
          }))
          setTwoFactorEnabled(Boolean(user.twoFactorEnabled))
        }
      } catch {
        // Ignore malformed local storage user payload.
      }
      setLoading(false)
      return
    }

    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((user) => {
        if (user?.email) {
          const pd = {
            name: user.name || '',
            email: user.email || '',
            avatar: user.profileData?.avatar || '',
            phone: user.profileData?.phone || '',
            age: user.profileData?.age || '',
            gender: user.profileData?.gender || 'Male',
            height: user.profileData?.height || '',
            currentWeight: user.profileData?.weight || '',
            goalWeight: user.profileData?.goalWeight || '',
            activityLevel: user.profileData?.activityLevel || 'Moderate',
            fitnessGoal: user.profileData?.fitnessGoal || 'General Fitness',
            joinDate: user.createdAt?.split('T')[0] || DEFAULT_PROFILE.joinDate,
          }
          setProfileData(pd)
          setTempData(pd)
          setTwoFactorEnabled(Boolean(user.twoFactorEnabled))
        }
      })
      .catch(() => {
        try {
          const saved = localStorage.getItem('userProfile')
          if (saved) {
            const parsed = JSON.parse(saved)
            const merged = { ...DEFAULT_PROFILE, ...parsed }
            setProfileData(merged)
            setTempData(merged)
          }
        } catch {
          // Ignore malformed cached profile and continue with API data.
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const numOrUndefined = (value) => {
    if (value === '' || value == null) return undefined
    const n = Number(value)
    return Number.isFinite(n) ? n : undefined
  }

  const handleEdit = () => {
    setTempData({ ...profileData })
    setIsEditing(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const token = getToken()

    if (token) {
      try {
        const res = await fetch(`${API_URL}/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            age: numOrUndefined(tempData.age),
            gender: tempData.gender,
            weight: numOrUndefined(tempData.currentWeight),
            height: numOrUndefined(tempData.height),
            goalWeight: numOrUndefined(tempData.goalWeight),
            activityLevel: tempData.activityLevel,
            fitnessGoal: tempData.fitnessGoal,
            phone: tempData.phone,
            avatar: tempData.avatar || '',
          }),
        })
        if (res.ok) {
          toast.success('Profile saved!')
        } else {
          toast.error('Failed to save to server, saved locally.')
        }
      } catch {
        toast.error('Server offline - saved locally.')
      }
    } else {
      toast.success('Profile saved locally!')
    }

    setProfileData({ ...tempData })
    localStorage.setItem('userProfile', JSON.stringify(tempData))
    setIsEditing(false)
    setSaving(false)
  }

  const handleCancel = () => {
    setTempData({ ...profileData })
    setIsEditing(false)
  }

  const handleAvatarUpload = (files) => {
    const file = files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large. Max 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : ''
      if (!dataUrl) {
        toast.error('Could not read image.')
        return
      }
      setTempData((prev) => ({ ...prev, avatar: dataUrl }))
      if (!isEditing) setIsEditing(true)
      toast.success('Avatar selected. Click Save to apply.')
    }
    reader.onerror = () => toast.error('Could not read image.')
    reader.readAsDataURL(file)
  }

  const toggleNotificationSetting = (key) => {
    setNotificationSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      localStorage.setItem('profileNotificationSettings', JSON.stringify(next))
      return next
    })
  }

  const handleSignOut = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.success('Signed out')
    navigate('/login')
  }

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please complete all password fields.')
      return
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Password confirmation does not match.')
      return
    }

    setSecurityLoading(true)
    try {
      await changePassword(currentPassword, newPassword)
      toast.success('Password changed successfully.')
      setSecurityModal(null)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      toast.error(error?.message || 'Could not change password.')
    } finally {
      setSecurityLoading(false)
    }
  }

  const handleEnable2FAStart = async () => {
    setSecurityLoading(true)
    try {
      const setup = await generate2FA()
      setTwoFactorSetup({ qrCode: setup.qrCode || '', secret: setup.secret || '' })
      setTwoFactorCode('')
      setSecurityModal('2fa-enable')
    } catch (error) {
      toast.error(error?.message || 'Failed to generate 2FA setup.')
    } finally {
      setSecurityLoading(false)
    }
  }

  const handleEnable2FAConfirm = async () => {
    if (!twoFactorCode.trim()) {
      toast.error('Enter verification code from your authenticator app.')
      return
    }

    setSecurityLoading(true)
    try {
      await verify2FA(twoFactorCode.trim())
      setTwoFactorEnabled(true)
      toast.success('Two-factor authentication enabled.')
      setSecurityModal(null)
      setTwoFactorCode('')
      setTwoFactorSetup({ qrCode: '', secret: '' })
    } catch (error) {
      toast.error(error?.message || 'Invalid verification code.')
    } finally {
      setSecurityLoading(false)
    }
  }

  const handleDisable2FAConfirm = async () => {
    if (!twoFactorCode.trim()) {
      toast.error('Enter your authenticator code to disable 2FA.')
      return
    }

    setSecurityLoading(true)
    try {
      await disable2FA(twoFactorCode.trim())
      setTwoFactorEnabled(false)
      toast.success('Two-factor authentication disabled.')
      setSecurityModal(null)
      setTwoFactorCode('')
    } catch (error) {
      toast.error(error?.message || 'Could not disable 2FA.')
    } finally {
      setSecurityLoading(false)
    }
  }

  const handleExportData = async () => {
    const token = getToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    const loadEndpoint = async (path) => {
      const res = await fetch(`${API_URL}${path}`, { headers })
      if (!res.ok) return null
      return res.json()
    }

    setSecurityLoading(true)
    try {
      const [workouts, meals, progress, water] = await Promise.all([
        loadEndpoint('/workouts'),
        loadEndpoint('/meals'),
        loadEndpoint('/progress'),
        loadEndpoint('/water'),
      ])

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        profile: profileData,
        notifications: notificationSettings,
        data: {
          workouts: workouts || [],
          meals: meals || [],
          progress: progress || [],
          water: water || [],
        },
      }

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `fitness-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(link.href)

      toast.success('Your data export is ready.')
    } catch {
      toast.error('Failed to export data.')
    } finally {
      setSecurityLoading(false)
    }
  }

  const currentWeightNum = Number(profileData.currentWeight) || 0
  const goalWeightNum = Number(profileData.goalWeight) || 0
  const hasWeightTargets = currentWeightNum > 0 && goalWeightNum > 0
  const goalGap = hasWeightTargets ? Number(Math.abs(currentWeightNum - goalWeightNum).toFixed(1)) : null
  const journeyPct = hasWeightTargets
    ? Math.min(
        100,
        Math.max(
          5,
          Math.round(
            (currentWeightNum <= goalWeightNum
              ? currentWeightNum / goalWeightNum
              : goalWeightNum / currentWeightNum) * 100
          )
        )
      )
    : 0
  const displayAvatar = isEditing ? tempData.avatar : profileData.avatar

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 relative overflow-x-hidden flex items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-950/70 p-8 animate-pulse">
          <div className="h-8 w-40 bg-zinc-800 rounded mb-6" />
          <div className="h-24 bg-zinc-800 rounded-2xl mb-4" />
          <div className="h-24 bg-zinc-800 rounded-2xl mb-4" />
          <div className="h-24 bg-zinc-800 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 relative overflow-x-hidden" style={{ fontFamily: "'Space Grotesk', 'Bebas Neue', sans-serif" }}>
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(900px 500px at 15% 10%, rgba(245,197,66,0.11), transparent 60%), radial-gradient(700px 500px at 85% 85%, rgba(255,255,255,0.06), transparent 70%)' }} />
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />

      <motion.header
        className="sticky top-0 z-50 px-5 md:px-8 h-20 flex items-center justify-between"
        style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(245,197,66,0.28)' }}
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center gap-4">
          <motion.button
            onClick={() => navigate('/dashboard')}
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,197,66,0.38)' }}
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.96 }}
          >
            <ArrowLeft size={20} className="text-amber-300" />
          </motion.button>
          <div>
            <p className="text-[10px] tracking-[0.35em] uppercase text-zinc-500">Wayne Systems</p>
            <h1 className="text-xl md:text-2xl font-bold tracking-[0.18em] uppercase text-amber-200">Profile Command</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <motion.button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl text-black font-bold tracking-[0.12em] uppercase text-xs"
                style={{ background: 'linear-gradient(120deg, #f5c542 0%, #eab308 100%)' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {saving ? 'Saving' : 'Save'}
              </motion.button>
              <motion.button
                onClick={handleCancel}
                className="px-4 py-2.5 rounded-xl text-zinc-200 font-semibold tracking-[0.1em] uppercase text-xs"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
            </>
          ) : (
            <motion.button
              onClick={handleEdit}
              className="px-5 py-2.5 rounded-xl text-black font-bold tracking-[0.1em] uppercase text-xs flex items-center gap-2"
              style={{ background: 'linear-gradient(120deg, #f5c542 0%, #d7a81b 100%)' }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Edit size={15} /> Edit
            </motion.button>
          )}
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-5 md:px-8 py-8 md:py-10 relative z-10 space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 md:p-8"
          style={{ background: 'linear-gradient(150deg, rgba(255,255,255,0.06) 0%, rgba(17,17,17,0.93) 35%, rgba(4,4,4,0.98) 100%)', border: '1px solid rgba(245,197,66,0.22)' }}
        >
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4">
              <div className="rounded-2xl p-6 h-full" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div className="w-28 h-28 rounded-2xl mx-auto flex items-center justify-center" style={{ background: 'linear-gradient(145deg, rgba(245,197,66,0.24), rgba(245,197,66,0.07))', border: '1px solid rgba(245,197,66,0.45)' }}>
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="Profile avatar" className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    <User size={44} className="text-amber-200" />
                  )}
                </div>
                {isEditing && (
                  <motion.button
                    onClick={() => avatarInputRef.current?.click()}
                    className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold uppercase tracking-[0.08em] text-amber-200 flex items-center justify-center gap-2"
                    style={{ border: '1px solid rgba(245,197,66,0.38)', background: 'rgba(245,197,66,0.09)' }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Camera size={15} /> Avatar
                  </motion.button>
                )}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAvatarUpload(e.target.files)}
                />

                <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Current</p>
                    <p className="text-lg font-bold text-amber-200">{profileData.currentWeight || '--'}</p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Goal</p>
                    <p className="text-lg font-bold text-emerald-300">{profileData.goalWeight || '--'}</p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Gap</p>
                    <p className="text-lg font-bold text-zinc-100">{goalGap == null ? '--' : `${goalGap}`}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-zinc-500">Identity</p>
                <h2 className="text-3xl md:text-4xl font-extrabold uppercase tracking-[0.08em] text-zinc-100">{profileData.name || 'Unnamed User'}</h2>
                <p className="text-zinc-400 mt-2">{profileData.email || 'No email set'}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-2 rounded-lg text-xs uppercase tracking-[0.13em]" style={{ background: 'rgba(245,197,66,0.12)', border: '1px solid rgba(245,197,66,0.36)', color: '#f5c542' }}>{profileData.fitnessGoal}</span>
                <span className="px-3 py-2 rounded-lg text-xs uppercase tracking-[0.13em]" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.18)' }}>{profileData.activityLevel}</span>
                <span className="px-3 py-2 rounded-lg text-xs uppercase tracking-[0.13em]" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.18)' }}>Since {new Date(profileData.joinDate).getFullYear()}</span>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="flex items-center gap-2 text-zinc-400 text-sm"><Phone size={14} /> {profileData.phone || 'Not set'}</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="flex items-center gap-2 text-zinc-400 text-sm"><Calendar size={14} /> {profileData.age || '--'} years</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="flex items-center gap-2 text-zinc-400 text-sm"><Ruler size={14} /> {profileData.height || '--'} cm</div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'profile', label: 'Personal', icon: User },
            { id: 'fitness', label: 'Fitness', icon: Activity },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-4 py-2.5 rounded-xl text-xs uppercase tracking-[0.12em] font-bold flex items-center gap-2"
                style={{
                  background: active ? 'linear-gradient(130deg, rgba(245,197,66,0.23), rgba(245,197,66,0.1))' : 'rgba(255,255,255,0.04)',
                  border: active ? '1px solid rgba(245,197,66,0.42)' : '1px solid rgba(255,255,255,0.13)',
                  color: active ? '#f5c542' : '#d4d4d8',
                }}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon size={14} /> {tab.label}
              </motion.button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.section key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="rounded-2xl p-6" style={{ background: 'rgba(10,10,10,0.88)', border: '1px solid rgba(255,255,255,0.14)' }}>
              <h3 className="text-xl uppercase tracking-[0.12em] font-bold text-amber-200 mb-6">Personal Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { label: 'Full Name', icon: User, field: 'name', type: 'text' },
                  { label: 'Email Address', icon: Mail, field: 'email', type: 'email' },
                  { label: 'Phone Number', icon: Phone, field: 'phone', type: 'tel' },
                  { label: 'Age', icon: Calendar, field: 'age', type: 'number' },
                ].map((input) => (
                  <div key={input.field} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}>
                    <label className="text-xs uppercase tracking-[0.14em] text-zinc-400 flex items-center gap-2 mb-2"><input.icon size={14} className="text-amber-300" />{input.label}</label>
                    <input
                      type={input.type}
                      value={isEditing ? tempData[input.field] : profileData[input.field]}
                      onChange={(e) => setTempData({ ...tempData, [input.field]: e.target.value })}
                      disabled={!isEditing}
                      className="w-full rounded-lg px-3 py-2.5 bg-black/50 border border-white/10 focus:outline-none focus:border-amber-400/50 text-zinc-100"
                    />
                  </div>
                ))}
                <div className="rounded-xl p-4 md:col-span-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}>
                  <label className="text-xs uppercase tracking-[0.14em] text-zinc-400 flex items-center gap-2 mb-2"><User size={14} className="text-amber-300" />Gender</label>
                  <select
                    value={isEditing ? tempData.gender : profileData.gender}
                    onChange={(e) => setTempData({ ...tempData, gender: e.target.value })}
                    disabled={!isEditing}
                    className="w-full rounded-lg px-3 py-2.5 bg-black/50 border border-white/10 focus:outline-none focus:border-amber-400/50 text-zinc-100"
                  >
                    <option className="bg-zinc-900">Male</option>
                    <option className="bg-zinc-900">Female</option>
                    <option className="bg-zinc-900">Other</option>
                  </select>
                </div>
              </div>
            </motion.section>
          )}

          {activeTab === 'fitness' && (
            <motion.section key="fitness" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="rounded-2xl p-6 space-y-6" style={{ background: 'rgba(10,10,10,0.88)', border: '1px solid rgba(255,255,255,0.14)' }}>
              <h3 className="text-xl uppercase tracking-[0.12em] font-bold text-amber-200">Fitness Metrics</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { label: 'Height (cm)', icon: Ruler, field: 'height', type: 'number' },
                  { label: 'Current Weight (kg)', icon: Weight, field: 'currentWeight', type: 'number' },
                  { label: 'Goal Weight (kg)', icon: Target, field: 'goalWeight', type: 'number' },
                  { label: 'Activity Level', icon: Activity, field: 'activityLevel', type: 'select', options: ['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active'] },
                ].map((input) => (
                  <div key={input.field} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}>
                    <label className="text-xs uppercase tracking-[0.14em] text-zinc-400 flex items-center gap-2 mb-2"><input.icon size={14} className="text-amber-300" />{input.label}</label>
                    {input.type === 'select' ? (
                      <select
                        value={isEditing ? tempData[input.field] : profileData[input.field]}
                        onChange={(e) => setTempData({ ...tempData, [input.field]: e.target.value })}
                        disabled={!isEditing}
                        className="w-full rounded-lg px-3 py-2.5 bg-black/50 border border-white/10 focus:outline-none focus:border-amber-400/50 text-zinc-100"
                      >
                        {input.options.map((opt) => <option key={opt} className="bg-zinc-900">{opt}</option>)}
                      </select>
                    ) : (
                      <input
                        type={input.type}
                        value={isEditing ? tempData[input.field] : profileData[input.field]}
                        onChange={(e) => setTempData({ ...tempData, [input.field]: e.target.value })}
                        disabled={!isEditing}
                        className="w-full rounded-lg px-3 py-2.5 bg-black/50 border border-white/10 focus:outline-none focus:border-amber-400/50 text-zinc-100"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}>
                <label className="text-xs uppercase tracking-[0.14em] text-zinc-400 flex items-center gap-2 mb-2"><Target size={14} className="text-amber-300" />Fitness Goal</label>
                <select
                  value={isEditing ? tempData.fitnessGoal : profileData.fitnessGoal}
                  onChange={(e) => setTempData({ ...tempData, fitnessGoal: e.target.value })}
                  disabled={!isEditing}
                  className="w-full rounded-lg px-3 py-2.5 bg-black/50 border border-white/10 focus:outline-none focus:border-amber-400/50 text-zinc-100"
                >
                  {['General Fitness', 'Weight Loss', 'Weight Gain', 'Muscle Building', 'Athletic Performance'].map((goal) => (
                    <option key={goal} className="bg-zinc-900">{goal}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(145deg, rgba(245,197,66,0.11), rgba(255,255,255,0.03))', border: '1px solid rgba(245,197,66,0.25)' }}>
                <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 mb-3">Journey Progress</p>
                {hasWeightTargets ? (
                  <>
                    <div className="h-3 bg-black/60 rounded-full overflow-hidden border border-white/10">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${journeyPct}%` }} transition={{ duration: 0.7 }} className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #f5c542 0%, #f59e0b 100%)' }} />
                    </div>
                    <div className="mt-3 text-sm text-zinc-300 flex justify-between">
                      <span>Current: {currentWeightNum} kg</span>
                      <span>Goal: {goalWeightNum} kg</span>
                    </div>
                  </>
                ) : (
                  <p className="text-zinc-500">Add current and goal weight to view your progress bar.</p>
                )}
              </div>
            </motion.section>
          )}

          {activeTab === 'settings' && (
            <motion.section key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="rounded-2xl p-6 space-y-6" style={{ background: 'rgba(10,10,10,0.88)', border: '1px solid rgba(255,255,255,0.14)' }}>
              <h3 className="text-xl uppercase tracking-[0.12em] font-bold text-amber-200">Control Room</h3>

              <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}>
                <p className="text-sm uppercase tracking-[0.14em] text-zinc-400 mb-4">Notifications</p>
                <div className="space-y-3">
                  {[
                    { key: 'workoutReminders', title: 'Workout Reminders', desc: 'Alerts before scheduled workouts' },
                    { key: 'progressReports', title: 'Progress Reports', desc: 'Weekly progress summary' },
                    { key: 'nutritionTips', title: 'Nutrition Tips', desc: 'Daily nutrition guidance' },
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between rounded-lg px-3 py-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div>
                        <p className="text-zinc-200 font-medium">{setting.title}</p>
                        <p className="text-zinc-500 text-xs">{setting.desc}</p>
                      </div>
                      <button onClick={() => toggleNotificationSetting(setting.key)} className="w-12 h-7 rounded-full p-1 transition-all" style={{ background: notificationSettings[setting.key] ? 'rgba(245,197,66,0.9)' : 'rgba(255,255,255,0.2)' }}>
                        <span className={`block w-5 h-5 rounded-full bg-black transition-transform ${notificationSettings[setting.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}>
                <p className="text-sm uppercase tracking-[0.14em] text-zinc-400 mb-2">Security Actions</p>
                <div className="space-y-2">
                  <button onClick={() => setSecurityModal('password')} className="w-full text-left rounded-lg px-3 py-3 hover:bg-white/5 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-zinc-200 font-medium">Change Password</p>
                        <p className="text-zinc-500 text-xs">Update your account password</p>
                      </div>
                      <ChevronRight size={16} className="text-zinc-500" />
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (twoFactorEnabled) {
                        setTwoFactorCode('')
                        setSecurityModal('2fa-disable')
                      } else {
                        handleEnable2FAStart()
                      }
                    }}
                    className="w-full text-left rounded-lg px-3 py-3 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-zinc-200 font-medium">Two-Factor Authentication</p>
                        <p className="text-zinc-500 text-xs">{twoFactorEnabled ? 'Enabled - click to disable' : 'Disabled - click to enable'}</p>
                      </div>
                      <ChevronRight size={16} className="text-zinc-500" />
                    </div>
                  </button>

                  <button onClick={handleExportData} className="w-full text-left rounded-lg px-3 py-3 hover:bg-white/5 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-zinc-200 font-medium">Export Your Data</p>
                        <p className="text-zinc-500 text-xs">Download your meals, workouts, progress and profile</p>
                      </div>
                      <ChevronRight size={16} className="text-zinc-500" />
                    </div>
                  </button>
                </div>
              </div>

              <motion.button
                onClick={handleSignOut}
                className="w-full md:w-auto px-6 py-3 rounded-xl font-bold uppercase tracking-[0.12em] text-red-300"
                style={{ background: 'rgba(127,29,29,0.24)', border: '1px solid rgba(248,113,113,0.5)' }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="inline-flex items-center gap-2"><LogOut size={15} /> Sign Out</span>
              </motion.button>
            </motion.section>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {securityModal && (
            <motion.div
              className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !securityLoading && setSecurityModal(null)}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ y: 10, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 8, opacity: 0, scale: 0.98 }}
                className="w-full max-w-lg rounded-2xl p-5 md:p-6"
                style={{ background: 'linear-gradient(170deg, rgba(16,16,16,0.98), rgba(8,8,8,0.98))', border: '1px solid rgba(245,197,66,0.3)' }}
              >
                {securityModal === 'password' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold uppercase tracking-[0.1em] text-amber-200">Change Password</h4>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="Current password"
                      className="w-full rounded-lg px-3 py-2.5 bg-black/50 border border-white/10 focus:outline-none focus:border-amber-400/50 text-zinc-100"
                    />
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="New password"
                      className="w-full rounded-lg px-3 py-2.5 bg-black/50 border border-white/10 focus:outline-none focus:border-amber-400/50 text-zinc-100"
                    />
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      className="w-full rounded-lg px-3 py-2.5 bg-black/50 border border-white/10 focus:outline-none focus:border-amber-400/50 text-zinc-100"
                    />

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setSecurityModal(null)}
                        className="px-4 py-2 rounded-lg text-zinc-300 border border-white/20"
                        disabled={securityLoading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleChangePassword}
                        className="px-4 py-2 rounded-lg text-black font-semibold"
                        style={{ background: 'linear-gradient(120deg, #f5c542 0%, #eab308 100%)' }}
                        disabled={securityLoading}
                      >
                        {securityLoading ? 'Saving...' : 'Update Password'}
                      </button>
                    </div>
                  </div>
                )}

                {securityModal === '2fa-enable' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold uppercase tracking-[0.1em] text-amber-200">Enable 2FA</h4>
                    <p className="text-sm text-zinc-400">Scan this QR code in Google Authenticator/Authy, then enter the 6-digit code.</p>
                    {twoFactorSetup.qrCode ? (
                      <div className="rounded-xl p-3 mx-auto w-fit" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)' }}>
                        <img src={twoFactorSetup.qrCode} alt="2FA QR code" className="w-44 h-44" />
                      </div>
                    ) : null}
                    <input
                      type="text"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      className="w-full rounded-lg px-3 py-2.5 bg-black/50 border border-white/10 focus:outline-none focus:border-amber-400/50 text-zinc-100"
                    />
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setSecurityModal(null)}
                        className="px-4 py-2 rounded-lg text-zinc-300 border border-white/20"
                        disabled={securityLoading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleEnable2FAConfirm}
                        className="px-4 py-2 rounded-lg text-black font-semibold"
                        style={{ background: 'linear-gradient(120deg, #f5c542 0%, #eab308 100%)' }}
                        disabled={securityLoading}
                      >
                        {securityLoading ? 'Verifying...' : 'Enable 2FA'}
                      </button>
                    </div>
                  </div>
                )}

                {securityModal === '2fa-disable' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold uppercase tracking-[0.1em] text-amber-200">Disable 2FA</h4>
                    <p className="text-sm text-zinc-400">Enter your current authenticator code to disable two-factor authentication.</p>
                    <input
                      type="text"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      className="w-full rounded-lg px-3 py-2.5 bg-black/50 border border-white/10 focus:outline-none focus:border-amber-400/50 text-zinc-100"
                    />
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setSecurityModal(null)}
                        className="px-4 py-2 rounded-lg text-zinc-300 border border-white/20"
                        disabled={securityLoading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDisable2FAConfirm}
                        className="px-4 py-2 rounded-lg text-red-100 font-semibold"
                        style={{ background: 'rgba(185,28,28,0.8)' }}
                        disabled={securityLoading}
                      >
                        {securityLoading ? 'Disabling...' : 'Disable 2FA'}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default ProfilePage
