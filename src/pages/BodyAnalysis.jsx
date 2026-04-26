import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Brain,
  Camera,
  CheckCircle,
  Dumbbell,
  Loader2,
  Save,
  Target,
  Trash2,
  Upload,
  Video,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useApi, apiPost, apiDelete } from '../hooks/useApi'
import { generateWithAI } from '../utils/ai'

const CALC_COLORS = {
  page: 'linear-gradient(120deg, #0b0f14 0%, #0f141b 35%, #121821 70%, #0b0f14 100%)',
  accent: '#d1d5db',
  signal: '#ef4444',
}

const MATTE = {
  panel: 'linear-gradient(155deg, rgba(255,255,255,0.08) 0%, rgba(26,32,44,0.92) 30%, rgba(9,12,18,0.98) 100%)',
  tile: 'linear-gradient(150deg, rgba(255,255,255,0.07) 0%, rgba(16,22,33,0.95) 45%, rgba(6,9,14,1) 100%)',
  inset: 'linear-gradient(170deg, rgba(255,255,255,0.03) 0%, rgba(20,26,34,0.95) 36%, rgba(11,15,21,1) 100%)',
  borderSoft: 'rgba(255,255,255,0.10)',
}

const FOCUS_AREAS = [
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Core',
  'Glutes',
  'Legs',
  'Posture',
]

const OBSERVATION_FLAGS = [
  'Rounded shoulders',
  'Forward head posture',
  'Weak core control',
  'Uneven left-right balance',
  'Lower body underdeveloped',
  'Upper body underdeveloped',
  'Midsection fat concentration',
  'Hip stability issues',
]

const safeText = (value, fallback = '') => {
  if (value == null) return fallback
  const s = String(value).trim()
  return s || fallback
}

const tryParseAI = (raw) => {
  if (!raw) return null
  try {
    if (typeof raw === 'object') return raw
    const cleaned = String(raw).trim()
    const match = cleaned.match(/\{[\s\S]*\}/)
    return JSON.parse(match ? match[0] : cleaned)
  } catch {
    return null
  }
}

const buildFallbackReport = ({ selectedAreas, observations, goal, experience }) => {
  const preferred = selectedAreas.length ? selectedAreas : ['Core', 'Back', 'Legs']
  const issueText = observations.length ? observations.join(', ') : 'general physique balance and posture improvement'

  const priorityAreas = preferred.slice(0, 4).map((area, i) => ({
    area,
    priority: i === 0 ? 'high' : i === 1 ? 'medium' : 'medium',
    reason: `Focused due to selected goals and detected pattern: ${issueText}.`,
    weeklySets: i === 0 ? 16 : 12,
  }))

  return {
    summary: `AI-assist fallback: primary improvement opportunities are in ${preferred.slice(0, 3).join(', ')} for a ${goal} objective (${experience} level).`,
    priorityAreas,
    actions: [
      'Train priority muscles 2-3 times per week with progressive overload.',
      'Start each session with posture and activation drills for 8-10 minutes.',
      'Track top-set performance weekly and adjust training volume every 2 weeks.',
      'Keep at least one recovery-focused day with mobility and light cardio.',
    ],
    weeklyFocus: [
      { day: 'Day 1', focus: `${preferred[0]} strength` },
      { day: 'Day 2', focus: `${preferred[1] || preferred[0]} hypertrophy` },
      { day: 'Day 3', focus: 'Mobility + core stability' },
      { day: 'Day 4', focus: `${preferred[2] || preferred[0]} volume` },
      { day: 'Day 5', focus: 'Conditioning + posture work' },
    ],
    cautions: [
      'Do not infer medical diagnosis from visual cues; use this as training guidance only.',
      'If pain exists, reduce load and consult a qualified coach or clinician.',
    ],
  }
}

function BodyAnalysis() {
  const navigate = useNavigate()
  const { data: analyses, loading: analysesLoading, refetch } = useApi('/body-analysis')

  const [analysisName, setAnalysisName] = useState('')
  const [goal, setGoal] = useState('recomposition')
  const [experience, setExperience] = useState('intermediate')
  const [selectedAreas, setSelectedAreas] = useState([])
  const [observations, setObservations] = useState([])

  const [mediaPreview, setMediaPreview] = useState('')
  const [mediaPersistValue, setMediaPersistValue] = useState('')
  const [mediaType, setMediaType] = useState('')
  const [mediaObjectUrl, setMediaObjectUrl] = useState('')

  const [aiReport, setAiReport] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    return () => {
      if (mediaObjectUrl) URL.revokeObjectURL(mediaObjectUrl)
    }
  }, [mediaObjectUrl])

  const backendAnalyses = useMemo(() => (Array.isArray(analyses) ? analyses : []), [analyses])

  const toggleArea = (area) => {
    setSelectedAreas((prev) => (prev.includes(area) ? prev.filter((x) => x !== area) : [...prev, area]))
  }

  const toggleObservation = (item) => {
    setObservations((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]))
  }

  const resetCurrent = () => {
    setAnalysisName('')
    setGoal('recomposition')
    setExperience('intermediate')
    setSelectedAreas([])
    setObservations([])
    setAiReport(null)
    setMediaType('')
    setMediaPreview('')
    setMediaPersistValue('')
    if (mediaObjectUrl) {
      URL.revokeObjectURL(mediaObjectUrl)
      setMediaObjectUrl('')
    }
  }

  const handleMediaUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      toast.error('Please upload an image or video file.')
      return
    }

    if (isImage && file.size > 6 * 1024 * 1024) {
      toast.error('Image too large. Use up to 6MB.')
      return
    }

    if (isVideo && file.size > 25 * 1024 * 1024) {
      toast.error('Video too large. Use up to 25MB.')
      return
    }

    if (mediaObjectUrl) {
      URL.revokeObjectURL(mediaObjectUrl)
      setMediaObjectUrl('')
    }

    setMediaType(isImage ? 'image' : 'video')

    if (isImage) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = safeText(e.target?.result)
        setMediaPreview(base64)
        setMediaPersistValue(base64)
      }
      reader.readAsDataURL(file)
    } else {
      const url = URL.createObjectURL(file)
      setMediaObjectUrl(url)
      setMediaPreview(url)
      setMediaPersistValue('')
    }

    toast.success(`${isImage ? 'Image' : 'Video'} uploaded.`)
  }

  const runAnalysis = async () => {
    if (!mediaPreview && selectedAreas.length === 0 && observations.length === 0) {
      toast.error('Upload media or select at least one area/observation.')
      return
    }

    setIsAnalyzing(true)
    try {
      const prompt = `You are a fitness coach AI.

Create a body-composition and training-priority analysis from the following user inputs:
- Goal: ${goal}
- Experience: ${experience}
- Selected focus areas: ${selectedAreas.join(', ') || 'none'}
- Observations: ${observations.join(', ') || 'none'}
- Media uploaded: ${mediaType || 'none'}

Return strict JSON only with this shape:
{
  "summary": "short paragraph",
  "priorityAreas": [
    {"area": "Core", "priority": "high|medium|low", "reason": "why", "weeklySets": 12}
  ],
  "actions": ["action 1", "action 2", "action 3"],
  "weeklyFocus": [
    {"day": "Day 1", "focus": "text"}
  ],
  "cautions": ["text"]
}

Prioritize practical workout guidance. Keep tone concise and direct.`

      const raw = await generateWithAI(prompt, 'body-analysis')
      const parsed = tryParseAI(raw)
      const report = parsed && Array.isArray(parsed.priorityAreas) ? parsed : buildFallbackReport({ selectedAreas, observations, goal, experience })
      setAiReport(report)
      toast.success('Analysis ready.')
    } catch {
      const report = buildFallbackReport({ selectedAreas, observations, goal, experience })
      setAiReport(report)
      toast.error('AI unavailable. Loaded fallback analysis.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const saveAnalysis = async () => {
    if (!aiReport) {
      toast.error('Run analysis first.')
      return
    }
    if (!analysisName.trim()) {
      toast.error('Give this analysis a name before saving.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: analysisName.trim(),
        photoUrl: mediaType === 'image' ? mediaPersistValue : '',
        focusAreas: selectedAreas,
        trainingPlan: JSON.stringify({
          goal,
          experience,
          observations,
          mediaType,
          report: aiReport,
        }),
      }

      const saved = await apiPost('/body-analysis', payload)
      if (!saved) {
        toast.error('Failed to save analysis to backend.')
        return
      }

      await refetch()
      toast.success('Analysis saved.')
    } finally {
      setSaving(false)
    }
  }

  const loadSaved = (analysis) => {
    setAnalysisName(analysis.name || '')
    setSelectedAreas(Array.isArray(analysis.focusAreas) ? analysis.focusAreas : [])

    const savedPhoto = safeText(analysis.photoUrl)
    if (savedPhoto) {
      setMediaType('image')
      setMediaPreview(savedPhoto)
      setMediaPersistValue(savedPhoto)
    } else {
      setMediaType('')
      setMediaPreview('')
      setMediaPersistValue('')
    }

    try {
      const parsed = JSON.parse(analysis.trainingPlan || '{}')
      setGoal(parsed.goal || 'recomposition')
      setExperience(parsed.experience || 'intermediate')
      setObservations(Array.isArray(parsed.observations) ? parsed.observations : [])
      setAiReport(parsed.report || null)
    } catch {
      setAiReport(null)
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
    toast.success('Analysis loaded.')
  }

  const deleteSaved = async (id) => {
    const ok = window.confirm('Delete this saved analysis?')
    if (!ok) return

    const deleted = await apiDelete(`/body-analysis/${id}`)
    if (!deleted) {
      toast.error('Could not delete analysis.')
      return
    }

    await refetch()
    toast.success('Analysis deleted.')
  }

  return (
    <div className="min-h-screen text-zinc-100 relative overflow-x-hidden" style={{ background: CALC_COLORS.page }}>
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 20% 10%, rgba(255,255,255,0.09), transparent 40%), radial-gradient(circle at 85% 85%, rgba(239,68,68,0.10), transparent 50%)' }} />

      <motion.header
        className="sticky top-0 z-50 px-4 md:px-8 h-20 flex items-center justify-between"
        style={{ background: 'rgba(6,8,11,0.82)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${MATTE.borderSoft}` }}
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center gap-3 md:gap-4">
          <motion.button
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${CALC_COLORS.accent}66` }}
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.96 }}
          >
            <ArrowLeft size={18} style={{ color: CALC_COLORS.accent }} />
          </motion.button>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.34em] text-zinc-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Engine Module</p>
            <h1 className="text-lg md:text-2xl font-black uppercase tracking-[0.1em]" style={{ color: CALC_COLORS.accent }}>Body Analysis AI</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetCurrent}
            className="px-3 py-2 rounded-lg text-xs font-semibold"
            style={{ background: MATTE.inset, border: `1px solid ${MATTE.borderSoft}`, color: '#cbd5e1' }}
          >
            Reset
          </button>
          <button
            onClick={saveAnalysis}
            disabled={saving || !aiReport}
            className="px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-60"
            style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${MATTE.borderSoft}`, color: CALC_COLORS.accent }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 grid xl:grid-cols-12 gap-6 relative z-10">
        <section className="xl:col-span-5 space-y-6">
          <div className="rounded-2xl p-5 md:p-6" style={{ background: MATTE.panel, border: `1px solid ${MATTE.borderSoft}` }}>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-zinc-300 mb-4" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Inputs
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 block">Analysis Name</label>
                <input
                  value={analysisName}
                  onChange={(e) => setAnalysisName(e.target.value)}
                  placeholder="Example: April front pose check"
                  className="w-full rounded-xl px-3 py-3 bg-black/40 border border-white/10 focus:outline-none text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 block">Goal</label>
                  <select value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full rounded-xl px-3 py-3 bg-black/40 border border-white/10 focus:outline-none text-zinc-100">
                    <option className="bg-zinc-900" value="recomposition">Recomposition</option>
                    <option className="bg-zinc-900" value="muscle_gain">Muscle Gain</option>
                    <option className="bg-zinc-900" value="fat_loss">Fat Loss</option>
                    <option className="bg-zinc-900" value="athletic">Athletic</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 block">Experience</label>
                  <select value={experience} onChange={(e) => setExperience(e.target.value)} className="w-full rounded-xl px-3 py-3 bg-black/40 border border-white/10 focus:outline-none text-zinc-100">
                    <option className="bg-zinc-900" value="beginner">Beginner</option>
                    <option className="bg-zinc-900" value="intermediate">Intermediate</option>
                    <option className="bg-zinc-900" value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 block">Upload Image or Video</label>
                <label className="w-full rounded-xl px-4 py-4 border border-dashed border-zinc-600/50 bg-black/35 flex items-center justify-center gap-2 cursor-pointer hover:border-zinc-400/70 transition-colors">
                  <Upload size={16} className="text-zinc-300" />
                  <span className="text-sm text-zinc-300">Choose file</span>
                  <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
                </label>
                <p className="text-xs text-zinc-500 mt-2">Videos are used for session context only and are not persisted to backend in this version.</p>
              </div>

              {mediaPreview ? (
                <div className="rounded-xl overflow-hidden border border-zinc-600/40 bg-black/30">
                  {mediaType === 'video' ? (
                    <video src={mediaPreview} controls className="w-full h-56 object-cover" />
                  ) : (
                    <img src={mediaPreview} alt="upload" className="w-full h-56 object-cover" />
                  )}
                </div>
              ) : null}

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 block">Focus Areas</label>
                <div className="grid grid-cols-2 gap-2">
                  {FOCUS_AREAS.map((area) => {
                    const active = selectedAreas.includes(area)
                    return (
                      <button
                        key={area}
                        onClick={() => toggleArea(area)}
                        className="rounded-lg px-3 py-2 text-xs text-left"
                        style={{ background: active ? 'rgba(255,255,255,0.14)' : MATTE.inset, border: `1px solid ${MATTE.borderSoft}` }}
                      >
                        {area}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 block">Observed Issues</label>
                <div className="space-y-2">
                  {OBSERVATION_FLAGS.map((flag) => {
                    const checked = observations.includes(flag)
                    return (
                      <button
                        key={flag}
                        onClick={() => toggleObservation(flag)}
                        className="w-full rounded-lg px-3 py-2 text-xs text-left flex items-center justify-between"
                        style={{ background: checked ? 'rgba(239,68,68,0.18)' : MATTE.inset, border: `1px solid ${MATTE.borderSoft}` }}
                      >
                        <span>{flag}</span>
                        {checked ? <CheckCircle size={14} className="text-red-300" /> : null}
                      </button>
                    )
                  })}
                </div>
              </div>

              <motion.button
                onClick={runAnalysis}
                disabled={isAnalyzing}
                className="w-full py-3.5 rounded-xl text-black font-black uppercase tracking-[0.16em] flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: `linear-gradient(120deg, ${CALC_COLORS.accent} 0%, #f3f4f6 100%)` }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                {isAnalyzing ? <Loader2 size={17} className="animate-spin" /> : <Brain size={17} />}
                {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
              </motion.button>
            </div>
          </div>

          <div className="rounded-2xl p-5 md:p-6" style={{ background: MATTE.panel, border: `1px solid ${MATTE.borderSoft}` }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-zinc-300" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                Saved Analyses
              </p>
              <span className="text-xs text-zinc-500">{backendAnalyses.length}</span>
            </div>

            {analysesLoading ? (
              <p className="text-sm text-zinc-500">Loading...</p>
            ) : backendAnalyses.length === 0 ? (
              <p className="text-sm text-zinc-500">No saved analyses yet.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {backendAnalyses.map((item) => (
                  <div key={item._id} className="rounded-lg px-3 py-2" style={{ background: MATTE.inset, border: `1px solid ${MATTE.borderSoft}` }}>
                    <div className="flex items-center justify-between gap-2">
                      <button onClick={() => loadSaved(item)} className="text-left flex-1">
                        <p className="text-sm text-zinc-100 font-medium">{item.name}</p>
                        <p className="text-xs text-zinc-500">{new Date(item.createdAt || item.date).toLocaleDateString()}</p>
                      </button>
                      <button onClick={() => deleteSaved(item._id)} className="p-1.5 rounded-md hover:bg-red-500/15 text-red-300">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="xl:col-span-7">
          <div className="rounded-2xl p-5 md:p-6 h-full" style={{ background: MATTE.panel, border: `1px solid ${MATTE.borderSoft}` }}>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-zinc-300 mb-4" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              AI Output
            </p>

            <AnimatePresence mode="wait">
              {aiReport ? (
                <motion.div key="report" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-5">
                  <div className="rounded-xl p-4" style={{ background: MATTE.inset, border: `1px solid ${MATTE.borderSoft}` }}>
                    <h3 className="text-zinc-100 font-semibold mb-2 flex items-center gap-2"><Brain size={16} className="text-zinc-300" />Summary</h3>
                    <p className="text-sm text-zinc-300 leading-relaxed">{safeText(aiReport.summary, 'No summary generated.')}</p>
                  </div>

                  <div className="rounded-xl p-4" style={{ background: MATTE.inset, border: `1px solid ${MATTE.borderSoft}` }}>
                    <h3 className="text-zinc-100 font-semibold mb-3 flex items-center gap-2"><Target size={16} className="text-red-300" />What To Work More On</h3>
                    <div className="space-y-2">
                      {(Array.isArray(aiReport.priorityAreas) ? aiReport.priorityAreas : []).map((item, i) => (
                        <div key={`${item.area}-${i}`} className="rounded-lg px-3 py-2" style={{ background: 'rgba(0,0,0,0.35)', border: `1px solid ${MATTE.borderSoft}` }}>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-zinc-100">{safeText(item.area, 'Area')}</p>
                            <span className="text-xs uppercase px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.2)', color: '#fecaca' }}>
                              {safeText(item.priority, 'medium')}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-1">{safeText(item.reason, '')}</p>
                          <p className="text-xs text-zinc-500 mt-1">Target weekly sets: {Number(item.weeklySets) || 10}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-xl p-4" style={{ background: MATTE.inset, border: `1px solid ${MATTE.borderSoft}` }}>
                      <h3 className="text-zinc-100 font-semibold mb-2 flex items-center gap-2"><Dumbbell size={16} className="text-zinc-300" />Action Steps</h3>
                      <ul className="space-y-2 text-sm text-zinc-300">
                        {(Array.isArray(aiReport.actions) ? aiReport.actions : []).map((line, i) => (
                          <li key={i} className="flex gap-2"><span className="text-red-300">•</span><span>{line}</span></li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl p-4" style={{ background: MATTE.inset, border: `1px solid ${MATTE.borderSoft}` }}>
                      <h3 className="text-zinc-100 font-semibold mb-2">Weekly Focus</h3>
                      <div className="space-y-2">
                        {(Array.isArray(aiReport.weeklyFocus) ? aiReport.weeklyFocus : []).map((row, i) => (
                          <div key={i} className="text-sm text-zinc-300 flex items-start justify-between gap-3">
                            <span className="text-zinc-500 min-w-14">{safeText(row.day, `Day ${i + 1}`)}</span>
                            <span className="text-right">{safeText(row.focus, '')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)' }}>
                    <h3 className="text-red-200 font-semibold mb-2">Cautions</h3>
                    <ul className="space-y-1 text-sm text-red-100/90">
                      {(Array.isArray(aiReport.cautions) ? aiReport.cautions : []).map((line, i) => (
                        <li key={i}>- {line}</li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full min-h-[520px] flex items-center justify-center text-center">
                  <div className="max-w-xl">
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${MATTE.borderSoft}` }}>
                      <Brain size={28} className="text-zinc-300" />
                    </div>
                    <h2 className="text-2xl font-black text-zinc-100 mb-2">AI Body Coach</h2>
                    <p className="text-zinc-500">Upload a body image/video, add your observations, and get practical recommendations on what to prioritize in training each week.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>
    </div>
  )
}

export default BodyAnalysis
