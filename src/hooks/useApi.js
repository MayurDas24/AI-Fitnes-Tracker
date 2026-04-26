// src/hooks/useApi.js
// Reusable hook for authenticated API calls to the backend
import { useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const DEMO_TOKEN = 'demo-token-skip-auth'

const getToken = () => {
  const t = localStorage.getItem('token')
  return t && t !== 'null' && t !== 'undefined' && t !== DEMO_TOKEN ? t : null
}

export function useApi(endpoint, { skip = false } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(!skip)
  const [error, setError] = useState(null)

  const fetch_ = useCallback(async () => {
    const token = getToken()
    if (!token || skip) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [endpoint, skip])

  useEffect(() => {
    fetch_()
  }, [fetch_])

  return { data, loading, error, refetch: fetch_ }
}

export async function apiGet(endpoint) {
  const token = getToken()
  if (!token) return null
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch {
    return null
  }
}

export async function apiPost(endpoint, body) {
  const token = getToken()
  if (!token) return null
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch {
    return null
  }
}

export async function apiDelete(endpoint) {
  const token = getToken()
  if (!token) return false
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.ok
  } catch {
    return false
  }
}
