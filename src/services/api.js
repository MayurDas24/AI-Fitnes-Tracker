// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Helper to get token — returns null if nothing valid is stored
const getToken = () => {
  const t = localStorage.getItem('token')
  return t && t !== 'null' && t !== 'undefined' ? t : null
}

// Helper for auth headers — omits Authorization when no token
const authHeaders = () => {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

// ============================================================
// AUTH
// ============================================================

// Keys that are user-specific and must be cleared on each new login
const USER_SPECIFIC_KEYS = [
  'favoriteExercises',
  'dailyMeals',
  'todayLog',
  'savedAnalyses',
  'generatedWorkoutPlan',
  'userCalorieData',
  'userProfile',
  'calculatorLastResult',
  'profileNotificationSettings',
  'waterIntake',
  'waterDate',
  'currentWorkout',
  'workoutTemplates',
  'workoutHistory',
]

export const clearUserData = () => {
  USER_SPECIFIC_KEYS.forEach(key => localStorage.removeItem(key))
}

const parseJsonSafe = async (res) => {
  try {
    return await res.json()
  } catch {
    return { message: 'Invalid server response' }
  }
}

const apiRequest = async (path, options = {}) => {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  })

  const data = await parseJsonSafe(res)

  if (res.status === 401) {
    logout()
  }

  if (!res.ok) {
    const err = new Error(data?.message || `Request failed with status ${res.status}`)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}

export const signup = async (name, email, password) => {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  })
  const data = await res.json()
  if (res.ok) {
    clearUserData()
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }
  return data
}

export const login = async (email, password, twoFactorToken) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, twoFactorToken })
  })
  const data = await res.json()
  if (res.ok && data.token) {
    clearUserData()
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }
  return data
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  clearUserData()
}

export const getCurrentUser = () => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

export const getUserProfile = async () => {
  return apiRequest('/auth/me')
}

export const changePassword = async (currentPassword, newPassword) => {
  return apiRequest('/auth/change-password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

export const generate2FA = async () => {
  return apiRequest('/auth/2fa/generate', {
    method: 'POST',
  })
}

export const verify2FA = async (token) => {
  return apiRequest('/auth/2fa/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
}

export const disable2FA = async (token) => {
  return apiRequest('/auth/2fa/disable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
}

export const isAuthenticated = () => {
  return !!getToken()
}

// ============================================================
// WORKOUTS
// ============================================================
export const getWorkouts = async () => {
  return apiRequest('/workouts')
}

export const saveWorkout = async (workoutData) => {
  return apiRequest('/workouts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workoutData)
  })
}

export const deleteWorkout = async (id) => {
  return apiRequest(`/workouts/${id}`, { method: 'DELETE' })
}

// ============================================================
// MEALS
// ============================================================
export const getMeals = async () => {
  return apiRequest('/meals')
}

export const getMealsByDate = async (date) => {
  return apiRequest(`/meals/date/${date}`)
}

export const saveMeal = async (mealData) => {
  return apiRequest('/meals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mealData)
  })
}

export const deleteMeal = async (id) => {
  return apiRequest(`/meals/${id}`, { method: 'DELETE' })
}

// ============================================================
// PROGRESS
// ============================================================
export const getProgress = async () => {
  return apiRequest('/progress')
}

export const saveProgress = async (progressData) => {
  return apiRequest('/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(progressData)
  })
}

export const deleteProgress = async (id) => {
  return apiRequest(`/progress/${id}`, { method: 'DELETE' })
}

// ============================================================
// WATER
// ============================================================
export const getWaterIntake = async () => {
  return apiRequest('/water')
}

export const getTodayWater = async () => {
  return apiRequest('/water/today')
}

export const saveWaterIntake = async (data) => {
  return apiRequest('/water', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}

export const deleteWaterIntake = async (id) => {
  return apiRequest(`/water/${id}`, { method: 'DELETE' })
}

// ============================================================
// FAVORITES
// ============================================================
export const getFavorites = async () => {
  return apiRequest('/favorites')
}

export const addFavorite = async (exercise) => {
  return apiRequest('/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(exercise)
  })
}

export const removeFavorite = async (exerciseId) => {
  return apiRequest(`/favorites/${exerciseId}`, { method: 'DELETE' })
}

// ============================================================
// BODY ANALYSIS
// ============================================================
export const getBodyAnalyses = async () => {
  return apiRequest('/body-analysis')
}

export const getBodyAnalysis = async (id) => {
  return apiRequest(`/body-analysis/${id}`)
}

export const saveBodyAnalysis = async (data) => {
  return apiRequest('/body-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}

export const updateBodyAnalysis = async (id, data) => {
  return apiRequest(`/body-analysis/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}

export const deleteBodyAnalysis = async (id) => {
  return apiRequest(`/body-analysis/${id}`, { method: 'DELETE' })
}

// ============================================================
// CALCULATIONS
// ============================================================
export const getCalculations = async () => {
  return apiRequest('/calculations')
}

export const getCalculationsByType = async (type) => {
  return apiRequest(`/calculations/${type}`)
}

export const saveCalculation = async (data) => {
  return apiRequest('/calculations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}

export const deleteCalculation = async (id) => {
  return apiRequest(`/calculations/${id}`, { method: 'DELETE' })
}

// ============================================================
// AI ASSISTANT
// ============================================================
export const sendAIMessage = async (messages) => {
  return apiRequest('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  })
}

export default {
  signup,
  login,
  logout,
  getCurrentUser,
  getUserProfile,
  changePassword,
  generate2FA,
  verify2FA,
  disable2FA,
  isAuthenticated,
  getWorkouts,
  saveWorkout,
  deleteWorkout,
  getMeals,
  getMealsByDate,
  saveMeal,
  deleteMeal,
  getProgress,
  saveProgress,
  deleteProgress,
  getWaterIntake,
  getTodayWater,
  saveWaterIntake,
  deleteWaterIntake,
  getFavorites,
  addFavorite,
  removeFavorite,
  getBodyAnalyses,
  getBodyAnalysis,
  saveBodyAnalysis,
  updateBodyAnalysis,
  deleteBodyAnalysis,
  getCalculations,
  getCalculationsByType,
  saveCalculation,
  deleteCalculation,
  sendAIMessage,
}
