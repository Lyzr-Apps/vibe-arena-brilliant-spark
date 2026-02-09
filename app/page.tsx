'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { callAIAgent, uploadFiles } from '@/lib/aiAgent'
import { copyToClipboard } from '@/lib/clipboard'
import { Loader2, X, RefreshCw, Check, Send, AlertCircle, Copy, Upload, Search, ArrowLeft, ExternalLink, Plus, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

// ─── Agent IDs ─────────────────────────────────────────
const VIBE_ORCHESTRATOR = '69899b87fbaecdb527a56dad'
const DEBATE_COORDINATOR = '69899b70157bf43b98dd6213'
const CREATOR_AGENT = '69899b4d9bf633d1a4f366a3'
const ANALYST_AGENT = '69899b7050cb2c0172eaeccd'

// ─── Types ─────────────────────────────────────────────
type AppMode = 'valentine' | 'anti-valentine'
type ScreenType = 'dashboard' | 'analyst' | 'duelist' | 'creator' | 'report'

interface DebaterInfo {
  name?: string
  argument?: string
  key_points?: string[]
  rebuttals?: string[]
  emotion_level?: number
}

interface DebateVerdict {
  winner?: string
  reasoning?: string
  final_score?: string
  audience_takeaway?: string
}

interface DebateData {
  mode?: string
  topic?: string
  status?: string
  round?: number
  total_rounds?: number
  introduction?: string
  debater_a?: DebaterInfo
  debater_b?: DebaterInfo
  round_summary?: string
  verdict?: DebateVerdict
  shareable_receipt?: string
}

interface Finding {
  type?: string
  title?: string
  description?: string
  severity?: number
  evidence?: string
}

interface VibeMeter {
  romance?: number
  toxicity?: number
  communication?: number
  effort?: number
  compatibility?: number
}

interface AnalystData {
  mode?: string
  analysis_type?: string
  overall_score?: number
  score_label?: string
  summary?: string
  findings?: Finding[]
  vibe_meter?: VibeMeter
  verdict?: string
  recommendations?: string[]
  receipts?: string
}

interface CreatorData {
  phase?: string
  mode?: string
  content_type?: string
  title?: string
  content?: string
  mood_tags?: string[]
  dedication?: string
  shareable_quote?: string
  image_prompt?: string
  question?: string
  question_number?: number
  total_questions?: number
  mood?: string
}

interface ScoreBreakdown {
  romance_quotient?: number
  independence_index?: number
  creativity_spark?: number
  debate_prowess?: number
}

interface VibeReport {
  vibe_score?: number
  score_breakdown?: ScoreBreakdown
  personality_type?: string
  insights?: string[]
  recommendations?: string[]
  viral_caption?: string
  spirit_animal?: string
  playlist_mood?: string
  final_verdict?: string
}

// ─── Sample Data ───────────────────────────────────────
const SAMPLE_ANALYST: AnalystData = {
  mode: 'valentine',
  analysis_type: 'vibe_check',
  overall_score: 90,
  score_label: 'Strong Connection',
  summary: 'This conversation overflows with warmth, attentiveness, and mutual enthusiasm. Both parties demonstrate genuine interest, playful rapport, and thoughtful effort.',
  findings: [
    { type: 'green_flag', title: 'Reciprocal Enthusiasm', description: 'Both display equal excitement to engage and propose plans.', severity: 9, evidence: "'I would love that! I was actually about to ask you the same thing'" },
    { type: 'green_flag', title: 'Thoughtful Personalization', description: 'Person A shows attentive care by reflecting knowledge of preferences.', severity: 8, evidence: "'I found this cute Italian place'" },
    { type: 'green_flag', title: 'Emotional Availability', description: 'Kind words and appreciation are exchanged freely.', severity: 7, evidence: "'Of course I do, you are important to me'" },
    { type: 'green_flag', title: 'Playful Rapport', description: 'Light mirroring creates effortless chemistry.', severity: 7, evidence: "'Great minds think alike!'" },
  ],
  vibe_meter: { romance: 93, toxicity: 2, communication: 95, effort: 90, compatibility: 92 },
  verdict: 'Sweet conversation energy -- the affection here could light up an entire Italian restaurant.',
  recommendations: ['Keep up the thoughtful gestures.', 'Continue creating shared experiences.', 'Express genuine appreciation -- it is clearly working!'],
  receipts: 'This convo radiates chemistry -- attentive, playful, and warm.',
}

const SAMPLE_DEBATE: DebateData = {
  mode: 'valentine',
  topic: 'Is it worth risking a friendship for a romantic relationship?',
  status: 'introduction',
  round: 1,
  total_rounds: 3,
  introduction: 'Welcome to tonight\'s heart-pounding showdown! The Hopeless Romantic faces off against The Practical Partner.',
  debater_a: { name: 'The Hopeless Romantic', argument: 'Love often blossoms from genuine friendships. Taking the leap can deepen your connection beyond what friendship alone can offer.', key_points: ['Strongest relationships start as friendships', 'Regret from never acting may haunt you more'], emotion_level: 8 },
  debater_b: { name: 'The Practical Partner', argument: 'A true friendship can last a lifetime. If things go awry, not only is the romance lost, but so is a cherished confidant.', rebuttals: ['Romantic attempts jeopardize years of trust', 'Not every spark should be a flame'], emotion_level: 6 },
  round_summary: 'Both debaters set a passionate and thoughtful stage.',
  verdict: { winner: '', reasoning: 'The debate is just getting started!', final_score: '0-0', audience_takeaway: 'Stay tuned for more fireworks!' },
  shareable_receipt: 'VibeSplit Valentine Debate: Should you risk a friendship for romance?',
}

const SAMPLE_CREATOR: CreatorData = {
  phase: 'generation',
  mode: 'valentine',
  content_type: 'poem',
  title: 'Love Brewed at First Sight',
  content: 'Two years ago, the world paused in a coffee shop,\nSteam curled in the air as my heartbeat rose and stopped.\nYou -- Alex, a page-turner in hand, sunlight on your face --\nA moment ordinary, transformed into fate\'s embrace.\n\nA nervous hello, the hush of porcelain and laughter,\nFingers brushing accidental, time tumbling ever after.\nHazelnut and hope blended in your smile so rare,\nI tasted forever in the sweetness lingering there.',
  mood_tags: ['sweet', 'passionate', 'nostalgic'],
  dedication: 'For Alex',
  shareable_quote: 'I tasted forever in the sweetness lingering there.',
  image_prompt: 'A sunlit coffee shop scene, cozy and inviting, with two people gazing at each other over steaming mugs.',
}

const SAMPLE_VIBE_REPORT: VibeReport = {
  vibe_score: 85,
  score_breakdown: { romance_quotient: 80, independence_index: 70, creativity_spark: 90, debate_prowess: 85 },
  personality_type: 'The Passionate Dreamer',
  insights: ['Your romantic energy runs deep and true.', 'You value both connection and independence.', 'Your creativity shines through in how you express love.'],
  recommendations: ['Lean into vulnerability more often.', 'Balance passion with patience.', 'Keep expressing yourself creatively.'],
  viral_caption: 'Hopeless romantic with a strategic mind -- chaotic good energy',
  spirit_animal: 'Phoenix',
  playlist_mood: 'Late Night Lo-Fi Romance',
  final_verdict: 'You are a rare blend of passion and wisdom. The kind of lover who writes poetry and builds futures.',
}

// ─── Helper: Extract Agent Data ────────────────────────
function extractAgentData(result: any): any {
  if (!result?.success) return null
  const resp = result?.response
  if (resp?.result && typeof resp.result === 'object' && Object.keys(resp.result).length > 0) {
    if (resp.result.text && typeof resp.result.text === 'string') {
      try { return JSON.parse(resp.result.text) } catch { return resp.result }
    }
    return resp.result
  }
  if (resp?.message && typeof resp.message === 'string') {
    try { return JSON.parse(resp.message) } catch { return { text: resp.message } }
  }
  return resp || null
}

// ─── Particle Background ──────────────────────────────
function ParticleBackground({ mode }: { mode: AppMode }) {
  const isValentine = mode === 'valentine'
  const particles = Array.from({ length: 12 }, (_, i) => i)

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((i) => {
        const left = `${(i * 8.3) % 100}%`
        const delay = `${(i * 0.8) % 6}s`
        const duration = `${6 + (i % 4) * 2}s`
        const size = 8 + (i % 3) * 4
        return (
          <div
            key={i}
            className="absolute animate-float-up"
            style={{ left, animationDelay: delay, animationDuration: duration, bottom: '-20px', opacity: 0.15 }}
          >
            {isValentine ? (
              <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF6496">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ) : (
              <svg width={size} height={size} viewBox="0 0 24 24" fill="#00FFFF" opacity="0.6">
                <path d="M7 2v11h3v9l7-12h-4l4-8z" />
              </svg>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Progress Ring ────────────────────────────────────
function ProgressRing({ completed, total, mode }: { completed: number; total: number; mode: AppMode }) {
  const radius = 36
  const stroke = 4
  const normalizedRadius = radius - stroke
  const circumference = normalizedRadius * 2 * Math.PI
  const progress = total > 0 ? (completed / total) * circumference : 0
  const isValentine = mode === 'valentine'
  const strokeColor = isValentine ? '#FF6496' : '#00FFFF'
  const glowColor = isValentine ? 'rgba(255,100,150,0.5)' : 'rgba(0,255,255,0.5)'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        <circle stroke="rgba(255,255,255,0.08)" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
        <circle
          stroke={strokeColor}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset: circumference - progress, transition: 'stroke-dashoffset 0.8s ease-out', filter: `drop-shadow(0 0 6px ${glowColor})` }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-bold" style={{ color: strokeColor }}>{completed}</span>
        <span className="text-[10px] text-muted-foreground">/ {total}</span>
      </div>
    </div>
  )
}

// ─── Vibe Bar ─────────────────────────────────────────
function VibeBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="text-xs text-muted-foreground w-28 text-right">{label}</span>
      <div className="flex-1 h-2 rounded-sm overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-sm transition-all duration-1000 ease-out" style={{ width: `${value}%`, background: color, boxShadow: `0 0 8px ${color}40` }} />
      </div>
      <span className="text-xs font-semibold w-8" style={{ color }}>{value}</span>
    </div>
  )
}

// ─── Flag Badge ───────────────────────────────────────
function FlagBadge({ type }: { type?: string }) {
  if (type === 'green_flag') return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Green Flag</Badge>
  if (type === 'red_flag') return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Red Flag</Badge>
  if (type === 'yellow_flag') return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Yellow Flag</Badge>
  return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">Flag</Badge>
}

// ─── Emotion Meter ────────────────────────────────────
function EmotionMeter({ level, color }: { level: number; color: string }) {
  const bars = Array.from({ length: 10 }, (_, i) => i)
  return (
    <div className="flex gap-0.5 items-end h-4">
      {bars.map((i) => (
        <div key={i} className="w-1 rounded-sm transition-all duration-300" style={{ height: `${40 + i * 6}%`, background: i < level ? color : 'rgba(255,255,255,0.08)', boxShadow: i < level ? `0 0 4px ${color}40` : 'none' }} />
      ))}
    </div>
  )
}

// ─── Terminal Sidebar ─────────────────────────────────
function TerminalSidebar({ thoughts, isOpen, onToggle, mode }: { thoughts: string[]; isOpen: boolean; onToggle: () => void; mode: AppMode }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isValentine = mode === 'valentine'

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [thoughts])

  return (
    <>
      <button onClick={onToggle} className="fixed bottom-4 right-4 z-50 w-10 h-10 rounded flex items-center justify-center glass-effect transition-all hover:scale-105" style={{ borderColor: isValentine ? 'rgba(255,100,150,0.4)' : 'rgba(0,255,255,0.4)', boxShadow: isValentine ? '0 0 12px rgba(255,100,150,0.3)' : '0 0 12px rgba(0,255,255,0.3)' }}>
        <Menu className="w-4 h-4" style={{ color: isValentine ? '#FF6496' : '#00FFFF' }} />
      </button>

      {isOpen && (
        <div className="fixed right-0 top-0 h-full w-72 z-40 glass-effect border-l flex flex-col" style={{ background: 'rgba(13, 10, 25, 0.95)', borderColor: isValentine ? 'rgba(255,100,150,0.2)' : 'rgba(0,255,255,0.2)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: isValentine ? '#FF6496' : '#00FFFF' }} />
              <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: isValentine ? '#FF6496' : '#00FFFF' }}>Agent Terminal</span>
            </div>
            <button onClick={onToggle} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 scrollbar-cyber space-y-2">
            {Array.isArray(thoughts) && thoughts.map((thought, i) => (
              <div key={i} className="text-xs p-2 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-muted-foreground mr-1">&gt;</span>
                <span style={{ color: isValentine ? '#FF6496' : '#66FFFF' }}>{thought}</span>
              </div>
            ))}
            {(!Array.isArray(thoughts) || thoughts.length === 0) && (
              <div className="text-xs text-muted-foreground p-2">Waiting for agent activity...</div>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground px-2">
              <span>&gt;</span>
              <span className="animate-terminal-blink">_</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Copy Button ──────────────────────────────────────
function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    const ok = await copyToClipboard(text)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 text-xs border-cyan-800/50 hover:border-cyan-600/50 hover:bg-cyan-950/30">
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
      {label || (copied ? 'Copied' : 'Copy')}
    </Button>
  )
}

// ─── Score Display ────────────────────────────────────
function ScoreDisplay({ score, label, mode }: { score: number; label?: string; mode: AppMode }) {
  const isValentine = mode === 'valentine'
  const color = isValentine ? '#FF6496' : '#00FFFF'
  const glow = isValentine ? 'rgba(255,100,150,0.4)' : 'rgba(0,255,255,0.4)'

  return (
    <div className="flex flex-col items-center animate-score-pop">
      <div className="text-6xl font-bold mb-1" style={{ color, textShadow: `0 0 20px ${glow}, 0 0 40px ${glow}` }}>
        {score}
      </div>
      {label && <span className="text-sm font-medium text-muted-foreground">{label}</span>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// ─── MAIN COMPONENT ───────────────────────────────────
// ═══════════════════════════════════════════════════════
export default function Home() {
  // ─── Core State ─────────────────────────────────────
  const [currentMode, setCurrentMode] = useState<AppMode>('valentine')
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard')
  const [showSampleData, setShowSampleData] = useState(false)
  const [terminalOpen, setTerminalOpen] = useState(false)
  const [terminalThoughts, setTerminalThoughts] = useState<string[]>([])
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // ─── Progress State ─────────────────────────────────
  const [progress, setProgress] = useState({ analyst: false, duelist: false, creator: false })

  // ─── Analyst State ──────────────────────────────────
  const [analystInput, setAnalystInput] = useState('')
  const [analystResult, setAnalystResult] = useState<AnalystData | null>(null)
  const [analystLoading, setAnalystLoading] = useState(false)
  const [analystError, setAnalystError] = useState<string | null>(null)

  // ─── Duelist State ──────────────────────────────────
  const [debateTopic, setDebateTopic] = useState('')
  const [debateRounds, setDebateRounds] = useState<DebateData[]>([])
  const [debateLoading, setDebateLoading] = useState(false)
  const [debateError, setDebateError] = useState<string | null>(null)

  // ─── Creator State ──────────────────────────────────
  const [creatorMessages, setCreatorMessages] = useState<Array<{ role: 'agent' | 'user'; text: string }>>([])
  const [creatorInput, setCreatorInput] = useState('')
  const [creatorResult, setCreatorResult] = useState<CreatorData | null>(null)
  const [creatorLoading, setCreatorLoading] = useState(false)
  const [creatorError, setCreatorError] = useState<string | null>(null)
  const [creatorSessionId] = useState(() => `creator-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
  const [creatorStarted, setCreatorStarted] = useState(false)

  // ─── Report State ───────────────────────────────────
  const [vibeReport, setVibeReport] = useState<VibeReport | null>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)

  // ─── Upload State ───────────────────────────────────
  const [uploadLoading, setUploadLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isValentine = currentMode === 'valentine'
  const completedCount = [progress.analyst, progress.duelist, progress.creator].filter(Boolean).length
  const finaleUnlocked = completedCount === 3

  // ─── Add Terminal Thought ───────────────────────────
  const addThought = useCallback((thought: string) => {
    setTerminalThoughts(prev => [...prev.slice(-30), thought])
  }, [])

  // ─── Sample Data Toggle Effect ──────────────────────
  useEffect(() => {
    if (showSampleData) {
      setAnalystResult(SAMPLE_ANALYST)
      setDebateRounds([SAMPLE_DEBATE])
      setCreatorResult(SAMPLE_CREATOR)
      setProgress({ analyst: true, duelist: true, creator: true })
      setTerminalThoughts([
        'Initializing VibeSplit experience...',
        'Valentine mode activated -- loading romantic energy...',
        'Analyst Agent: Chat analysis complete. Score: 90/100.',
        'Debate Coordinator: Round 1 sparked a fiery exchange!',
        'Creator Agent: Poetry generation complete. A masterpiece awaits.',
        'All apps complete! Finale unlocked.',
      ])
    } else {
      setAnalystResult(null)
      setDebateRounds([])
      setCreatorResult(null)
      setCreatorMessages([])
      setCreatorStarted(false)
      setVibeReport(null)
      setProgress({ analyst: false, duelist: false, creator: false })
      setTerminalThoughts([])
    }
  }, [showSampleData])

  // ─── Analyst: Submit ────────────────────────────────
  const handleAnalystSubmit = async () => {
    if (!analystInput.trim()) return
    setAnalystLoading(true)
    setAnalystError(null)
    setActiveAgentId(ANALYST_AGENT)
    addThought('Analyst Agent: Scanning conversation for vibes...')

    try {
      const message = `Mode: ${currentMode}. Analyze this chat conversation: ${analystInput}`
      const result = await callAIAgent(message, ANALYST_AGENT)
      const data = extractAgentData(result)

      if (data && (data.overall_score !== undefined || data.findings)) {
        setAnalystResult(data as AnalystData)
        setProgress(prev => ({ ...prev, analyst: true }))
        addThought(`Analyst Agent: Analysis complete! Score: ${data.overall_score ?? 'N/A'}/100`)
      } else if (data?.text) {
        setAnalystError('Agent returned text instead of structured analysis. Please try again.')
        addThought('Analyst Agent: Unexpected response format.')
      } else {
        setAnalystError('Could not parse analysis results. Please try again.')
        addThought('Analyst Agent: Error parsing response.')
      }
    } catch (err) {
      setAnalystError('Failed to connect to the Analyst Agent.')
      addThought('Analyst Agent: Connection error.')
    } finally {
      setAnalystLoading(false)
      setActiveAgentId(null)
    }
  }

  // ─── Analyst: File Upload ───────────────────────────
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploadLoading(true)
    addThought('Uploading file for analysis...')

    try {
      const uploadResult = await uploadFiles(Array.from(files))
      if (uploadResult.success && Array.isArray(uploadResult.asset_ids) && uploadResult.asset_ids.length > 0) {
        setAnalystLoading(true)
        setActiveAgentId(ANALYST_AGENT)
        addThought('Analyst Agent: Processing uploaded file...')

        const message = `Mode: ${currentMode}. Analyze the uploaded chat screenshot for relationship insights.`
        const result = await callAIAgent(message, ANALYST_AGENT, { assets: uploadResult.asset_ids })
        const data = extractAgentData(result)

        if (data && (data.overall_score !== undefined || data.findings)) {
          setAnalystResult(data as AnalystData)
          setProgress(prev => ({ ...prev, analyst: true }))
          addThought(`Analyst Agent: File analysis complete! Score: ${data.overall_score ?? 'N/A'}/100`)
        } else {
          setAnalystError('Could not parse file analysis results.')
          addThought('Analyst Agent: Error parsing file analysis.')
        }
        setAnalystLoading(false)
        setActiveAgentId(null)
      } else {
        setAnalystError('File upload failed. Please try pasting text instead.')
        addThought('Upload failed.')
      }
    } catch (err) {
      setAnalystError('Upload error. Please try pasting text instead.')
      addThought('Upload error.')
    } finally {
      setUploadLoading(false)
    }
  }

  // ─── Duelist: Start Debate ──────────────────────────
  const handleDebateStart = async () => {
    if (!debateTopic.trim()) return
    setDebateLoading(true)
    setDebateError(null)
    setDebateRounds([])
    setActiveAgentId(DEBATE_COORDINATOR)
    addThought(`Debate Coordinator: Setting up debate on "${debateTopic}"...`)

    try {
      const message = `Mode: ${currentMode}. Topic: ${debateTopic}. Debate this topic with both debaters arguing their positions.`
      const result = await callAIAgent(message, DEBATE_COORDINATOR)
      const data = extractAgentData(result)

      if (data && (data.debater_a || data.introduction || data.topic)) {
        setDebateRounds([data as DebateData])
        setProgress(prev => ({ ...prev, duelist: true }))
        addThought(`Debate Coordinator: Round ${data.round ?? 1} complete!`)
      } else if (data?.text) {
        setDebateError('Debate Coordinator returned unstructured response. Please try again.')
        addThought('Debate Coordinator: Unexpected format.')
      } else {
        setDebateError('Could not start the debate. Please try again.')
        addThought('Debate Coordinator: Error starting debate.')
      }
    } catch (err) {
      setDebateError('Failed to connect to the Debate Coordinator.')
      addThought('Debate Coordinator: Connection error.')
    } finally {
      setDebateLoading(false)
      setActiveAgentId(null)
    }
  }

  // ─── Duelist: Continue Debate ───────────────────────
  const handleDebateContinue = async () => {
    setDebateLoading(true)
    setDebateError(null)
    setActiveAgentId(DEBATE_COORDINATOR)
    const currentRound = debateRounds.length > 0 ? (debateRounds[debateRounds.length - 1]?.round ?? 1) : 0
    addThought(`Debate Coordinator: Starting round ${currentRound + 1}...`)

    try {
      const message = `Mode: ${currentMode}. Topic: ${debateTopic}. Continue the debate to round ${currentRound + 1}. Provide the next round of arguments.`
      const result = await callAIAgent(message, DEBATE_COORDINATOR)
      const data = extractAgentData(result)

      if (data && (data.debater_a || data.round_summary)) {
        setDebateRounds(prev => [...prev, data as DebateData])
        addThought(`Debate Coordinator: Round ${data.round ?? currentRound + 1} complete!`)
      } else {
        setDebateError('Could not continue the debate.')
        addThought('Debate Coordinator: Error continuing.')
      }
    } catch (err) {
      setDebateError('Connection error.')
      addThought('Debate Coordinator: Connection error.')
    } finally {
      setDebateLoading(false)
      setActiveAgentId(null)
    }
  }

  // ─── Creator: Start Interview ───────────────────────
  const handleCreatorStart = async () => {
    setCreatorStarted(true)
    setCreatorLoading(true)
    setCreatorError(null)
    setCreatorMessages([])
    setCreatorResult(null)
    setActiveAgentId(CREATOR_AGENT)
    addThought('Creator Agent: Starting creative interview...')

    try {
      const message = `Mode: ${currentMode}. Start the creative content interview. Ask me your first question.`
      const result = await callAIAgent(message, CREATOR_AGENT, { session_id: creatorSessionId })
      const data = extractAgentData(result)

      if (data?.question || data?.phase === 'interview') {
        setCreatorMessages([{ role: 'agent', text: data.question || 'Tell me about yourself and what you would like me to create.' }])
        addThought(`Creator Agent: Interview started. Question ${data.question_number ?? 1} of ${data.total_questions ?? 3}`)
      } else if (data?.phase === 'generation') {
        setCreatorResult(data as CreatorData)
        setCreatorMessages([{ role: 'agent', text: 'Here is your creative content!' }])
        setProgress(prev => ({ ...prev, creator: true }))
        addThought('Creator Agent: Content generated!')
      } else {
        setCreatorMessages([{ role: 'agent', text: 'Tell me about yourself and what you would like me to create for you.' }])
        addThought('Creator Agent: Interview started with default question.')
      }
    } catch (err) {
      setCreatorError('Failed to start creative interview.')
      addThought('Creator Agent: Connection error.')
    } finally {
      setCreatorLoading(false)
      setActiveAgentId(null)
    }
  }

  // ─── Creator: Send Response ─────────────────────────
  const handleCreatorSend = async () => {
    if (!creatorInput.trim()) return
    const userMsg = creatorInput
    setCreatorInput('')
    setCreatorMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setCreatorLoading(true)
    setCreatorError(null)
    setActiveAgentId(CREATOR_AGENT)
    addThought('Creator Agent: Processing your response...')

    try {
      const message = `Mode: ${currentMode}. ${userMsg}`
      const result = await callAIAgent(message, CREATOR_AGENT, { session_id: creatorSessionId })
      const data = extractAgentData(result)

      if (data?.phase === 'generation') {
        setCreatorResult(data as CreatorData)
        setCreatorMessages(prev => [...prev, { role: 'agent', text: 'Your creative content is ready!' }])
        setProgress(prev => ({ ...prev, creator: true }))
        addThought(`Creator Agent: Content generated -- "${data.title ?? 'Untitled'}"`)
      } else if (data?.question || data?.phase === 'interview') {
        setCreatorMessages(prev => [...prev, { role: 'agent', text: data.question || 'Tell me more...' }])
        addThought(`Creator Agent: Question ${data.question_number ?? '?'} of ${data.total_questions ?? 3}`)
      } else if (data?.content || data?.title) {
        setCreatorResult(data as CreatorData)
        setCreatorMessages(prev => [...prev, { role: 'agent', text: 'Your creative content is ready!' }])
        setProgress(prev => ({ ...prev, creator: true }))
        addThought('Creator Agent: Content generated!')
      } else {
        setCreatorMessages(prev => [...prev, { role: 'agent', text: data?.text || 'Thank you! Let me create something special for you.' }])
        addThought('Creator Agent: Response processed.')
      }
    } catch (err) {
      setCreatorError('Failed to send response.')
      addThought('Creator Agent: Connection error.')
    } finally {
      setCreatorLoading(false)
      setActiveAgentId(null)
    }
  }

  // ─── Report: Generate ───────────────────────────────
  const handleGenerateReport = async () => {
    if (showSampleData) {
      setVibeReport(SAMPLE_VIBE_REPORT)
      setCurrentScreen('report')
      return
    }
    setReportLoading(true)
    setReportError(null)
    setActiveAgentId(VIBE_ORCHESTRATOR)
    addThought('Vibe Orchestrator: Generating Ultimate Vibe Report...')

    try {
      const summary = {
        mode: currentMode,
        analyst: analystResult ? { score: analystResult.overall_score, label: analystResult.score_label, verdict: analystResult.verdict } : null,
        debate: debateRounds.length > 0 ? { topic: debateRounds[0]?.topic, rounds: debateRounds.length } : null,
        creator: creatorResult ? { title: creatorResult.title, type: creatorResult.content_type } : null,
      }

      const message = `Mode: ${currentMode}. Generate the Ultimate Vibe Report. All 3 apps are complete. Summary: ${JSON.stringify(summary)}`
      const result = await callAIAgent(message, VIBE_ORCHESTRATOR)
      const data = extractAgentData(result)

      if (data?.vibe_report) {
        setVibeReport(data.vibe_report as VibeReport)
        if (Array.isArray(data.terminal_thoughts)) {
          data.terminal_thoughts.forEach((t: string) => addThought(t))
        }
        addThought('Vibe Orchestrator: Ultimate Vibe Report ready!')
        setCurrentScreen('report')
      } else if (data?.vibe_score !== undefined) {
        setVibeReport(data as VibeReport)
        addThought('Vibe Orchestrator: Report generated!')
        setCurrentScreen('report')
      } else {
        setReportError('Could not generate the Vibe Report. Please try again.')
        addThought('Vibe Orchestrator: Error generating report.')
      }
    } catch (err) {
      setReportError('Failed to connect to the Vibe Orchestrator.')
      addThought('Vibe Orchestrator: Connection error.')
    } finally {
      setReportLoading(false)
      setActiveAgentId(null)
    }
  }

  // ─── Mode Colors ───────────────────────────────────
  const accentColor = isValentine ? '#FF6496' : '#00FFFF'
  const accentGlow = isValentine ? 'rgba(255,100,150,0.3)' : 'rgba(0,255,255,0.3)'
  const secondaryAccent = isValentine ? '#E600E6' : '#E600E6'
  const cardBorderClass = isValentine ? 'neon-border-pink' : 'neon-border-cyan'
  const pulseClass = isValentine ? 'animate-pulse-pink' : 'animate-pulse-cyan'

  // ═══════════════════════════════════════════════════
  // ─── DASHBOARD SCREEN ──────────────────────────────
  // ═══════════════════════════════════════════════════
  function DashboardScreen() {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: accentColor, textShadow: `0 0 20px ${accentGlow}` }}>
              VibeSplit
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isValentine ? 'The ultimate Valentine experience' : 'The ultimate Anti-Valentine experience'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Sample Data Toggle */}
            <div className="flex items-center gap-2">
              <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground">Sample Data</Label>
              <Switch id="sample-toggle" checked={showSampleData} onCheckedChange={setShowSampleData} />
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center gap-2 p-1.5 rounded glass-effect" style={{ borderColor: isValentine ? 'rgba(255,100,150,0.3)' : 'rgba(0,255,255,0.3)' }}>
              <span className="text-xs px-2" style={{ color: isValentine ? '#FF6496' : '#66FFFF', opacity: isValentine ? 1 : 0.5 }}>Valentine</span>
              <Switch
                checked={!isValentine}
                onCheckedChange={(checked) => setCurrentMode(checked ? 'anti-valentine' : 'valentine')}
              />
              <span className="text-xs px-2" style={{ color: !isValentine ? '#00FFFF' : '#66FFFF', opacity: !isValentine ? 1 : 0.5 }}>Anti-Valentine</span>
            </div>
          </div>
        </div>

        {/* Progress + Welcome */}
        <div className="flex items-start gap-6">
          <ProgressRing completed={completedCount} total={3} mode={currentMode} />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isValentine
                ? 'Explore three AI-powered experiences to discover your romantic vibe. Complete all three to unlock your Ultimate Vibe Report.'
                : 'Embrace the chaos with three AI-powered experiences. Complete all three to unlock your Ultimate Anti-Vibe Report.'}
            </p>
            {finaleUnlocked && (
              <div className="mt-3">
                <Button onClick={handleGenerateReport} disabled={reportLoading} className="gap-2 font-semibold" style={{ background: `linear-gradient(135deg, ${accentColor}, ${secondaryAccent})`, color: '#fff', boxShadow: `0 0 20px ${accentGlow}` }}>
                  {reportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                  {reportLoading ? 'Generating...' : 'Unlock Ultimate Vibe Report'}
                </Button>
                {reportError && <p className="text-xs text-destructive mt-2">{reportError}</p>}
              </div>
            )}
          </div>
        </div>

        {/* App Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Analyst Card */}
          <Card className={`glass-effect cursor-pointer transition-all hover:scale-[1.02] ${cardBorderClass} ${progress.analyst ? pulseClass : ''}`} onClick={() => setCurrentScreen('analyst')}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}>
                  <Search className="w-5 h-5" style={{ color: accentColor }} />
                </div>
                {progress.analyst && <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">Done</Badge>}
              </div>
              <CardTitle className="text-base mt-2" style={{ color: accentColor }}>The Analyst</CardTitle>
              <CardDescription className="text-xs">
                {isValentine ? 'Vibe Lab -- Analyze your chats for romantic insights' : 'Toxicity Scanner -- Find the red flags hiding in plain sight'}
              </CardDescription>
            </CardHeader>
            <CardFooter className="pt-2">
              <Button variant="outline" size="sm" className="w-full text-xs" style={{ borderColor: `${accentColor}40`, color: accentColor }}>
                {progress.analyst ? 'View Results' : 'Start Analysis'}
              </Button>
            </CardFooter>
          </Card>

          {/* Duelist Card */}
          <Card className={`glass-effect cursor-pointer transition-all hover:scale-[1.02] ${cardBorderClass} ${progress.duelist ? pulseClass : ''}`} onClick={() => setCurrentScreen('duelist')}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: `${secondaryAccent}15`, border: `1px solid ${secondaryAccent}30` }}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={secondaryAccent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                {progress.duelist && <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">Done</Badge>}
              </div>
              <CardTitle className="text-base mt-2" style={{ color: secondaryAccent }}>The Duelist</CardTitle>
              <CardDescription className="text-xs">
                {isValentine ? 'Debate Arena -- Watch AI battle over love topics' : 'Roast Colosseum -- AI tears apart relationship myths'}
              </CardDescription>
            </CardHeader>
            <CardFooter className="pt-2">
              <Button variant="outline" size="sm" className="w-full text-xs" style={{ borderColor: `${secondaryAccent}40`, color: secondaryAccent }}>
                {progress.duelist ? 'View Debate' : 'Start Debate'}
              </Button>
            </CardFooter>
          </Card>

          {/* Creator Card */}
          <Card className={`glass-effect cursor-pointer transition-all hover:scale-[1.02] ${cardBorderClass} ${progress.creator ? pulseClass : ''}`} onClick={() => setCurrentScreen('creator')}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: '#FFFF0015', border: '1px solid #FFFF0030' }}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#FFFF00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
                    <line x1="16" y1="8" x2="2" y2="22" />
                    <line x1="17.5" y1="15" x2="9" y2="15" />
                  </svg>
                </div>
                {progress.creator && <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">Done</Badge>}
              </div>
              <CardTitle className="text-base mt-2 neon-text-yellow">The Creator</CardTitle>
              <CardDescription className="text-xs">
                {isValentine ? 'Content Studio -- Generate poetry and love letters' : 'Manifesto Factory -- Craft breakup anthems and roasts'}
              </CardDescription>
            </CardHeader>
            <CardFooter className="pt-2">
              <Button variant="outline" size="sm" className="w-full text-xs" style={{ borderColor: '#FFFF0040', color: '#FFFF00' }}>
                {progress.creator ? 'View Content' : 'Start Creating'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Finale Card */}
        {finaleUnlocked && !reportLoading && (
          <Card className={`glass-effect ${cardBorderClass} ${pulseClass}`} style={{ background: `linear-gradient(135deg, rgba(0,255,255,0.05), rgba(230,0,230,0.05))` }}>
            <CardContent className="py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm" style={{ color: accentColor }}>All Apps Complete!</h3>
                <p className="text-xs text-muted-foreground mt-1">Your Ultimate Vibe Report awaits. Unlock your relationship persona.</p>
              </div>
              <Button onClick={handleGenerateReport} disabled={reportLoading} size="sm" style={{ background: `linear-gradient(135deg, ${accentColor}, ${secondaryAccent})`, color: '#fff' }}>
                {reportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Report'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Agent Info */}
        <Card className="glass-effect border-0" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <CardContent className="py-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Agents Online</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { id: ANALYST_AGENT, name: 'Analyst', purpose: 'Chat Analysis' },
                { id: DEBATE_COORDINATOR, name: 'Debate Coordinator', purpose: 'AI Debates' },
                { id: CREATOR_AGENT, name: 'Creator', purpose: 'Content Gen' },
                { id: VIBE_ORCHESTRATOR, name: 'Orchestrator', purpose: 'Vibe Report' },
              ].map((agent) => (
                <div key={agent.id} className="flex items-center gap-2 p-1.5 rounded" style={{ background: activeAgentId === agent.id ? `${accentColor}10` : 'transparent' }}>
                  <div className={`w-1.5 h-1.5 rounded-full ${activeAgentId === agent.id ? 'animate-pulse' : ''}`} style={{ background: activeAgentId === agent.id ? accentColor : '#4ade80' }} />
                  <div>
                    <span className="text-[10px] font-medium" style={{ color: activeAgentId === agent.id ? accentColor : 'hsl(180, 50%, 45%)' }}>{agent.name}</span>
                    <span className="text-[9px] text-muted-foreground ml-1">{agent.purpose}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════
  // ─── ANALYST SCREEN ────────────────────────────────
  // ═══════════════════════════════════════════════════
  function AnalystScreen() {
    const data = analystResult

    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setCurrentScreen('dashboard')} className="gap-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div>
            <h2 className="text-xl font-bold" style={{ color: accentColor }}>
              {isValentine ? 'Vibe Lab' : 'Toxicity Scanner'}
            </h2>
            <p className="text-xs text-muted-foreground">Paste a chat conversation to analyze relationship dynamics</p>
          </div>
        </div>

        {/* Input */}
        {!data && (
          <Card className={`glass-effect ${cardBorderClass}`}>
            <CardContent className="pt-4 space-y-4">
              <Textarea
                placeholder="Paste your chat conversation here... (e.g., Person A: Hey! How was your day? / Person B: Great, got even better now that you texted me!)"
                value={analystInput}
                onChange={(e) => setAnalystInput(e.target.value)}
                className="min-h-[160px] bg-transparent border-0 focus-visible:ring-1 text-sm"
                style={{ borderColor: `${accentColor}20` }}
              />

              <div className="flex items-center gap-3">
                <Button onClick={handleAnalystSubmit} disabled={analystLoading || !analystInput.trim()} className="gap-2" style={{ background: accentColor, color: '#0d0a19' }}>
                  {analystLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {analystLoading ? 'Analyzing...' : 'Analyze Vibes'}
                </Button>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">or</span>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadLoading} className="gap-1 text-xs" style={{ borderColor: `${accentColor}30`, color: accentColor }}>
                    {uploadLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    Upload Screenshot
                  </Button>
                </div>
              </div>

              {analystError && (
                <div className="flex items-center gap-2 text-xs text-destructive">
                  <AlertCircle className="w-3 h-3" /> {analystError}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {data && (
          <div className="space-y-4 animate-fade-in-up">
            {/* Score */}
            <Card className={`glass-effect ${cardBorderClass}`}>
              <CardContent className="pt-6 pb-4 flex flex-col items-center">
                <ScoreDisplay score={data.overall_score ?? 0} label={data.score_label} mode={currentMode} />
                <p className="text-sm text-muted-foreground mt-3 text-center max-w-md">{data.summary}</p>
              </CardContent>
            </Card>

            {/* Vibe Meter */}
            <Card className={`glass-effect ${cardBorderClass}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm" style={{ color: accentColor }}>Vibe Meter</CardTitle>
              </CardHeader>
              <CardContent>
                <VibeBar label="Romance" value={data.vibe_meter?.romance ?? 0} color="#FF6496" />
                <VibeBar label="Toxicity" value={data.vibe_meter?.toxicity ?? 0} color="#FF4444" />
                <VibeBar label="Communication" value={data.vibe_meter?.communication ?? 0} color="#00FFFF" />
                <VibeBar label="Effort" value={data.vibe_meter?.effort ?? 0} color="#E600E6" />
                <VibeBar label="Compatibility" value={data.vibe_meter?.compatibility ?? 0} color="#FFFF00" />
              </CardContent>
            </Card>

            {/* Findings */}
            <Card className={`glass-effect ${cardBorderClass}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm" style={{ color: accentColor }}>Findings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.isArray(data.findings) && data.findings.map((finding, i) => (
                  <div key={i} className="p-3 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <FlagBadge type={finding.type} />
                      <span className="text-sm font-medium">{finding.title}</span>
                      {finding.severity !== undefined && (
                        <span className="text-[10px] text-muted-foreground ml-auto">{finding.severity}/10</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{finding.description}</p>
                    {finding.evidence && (
                      <p className="text-xs mt-1 italic" style={{ color: `${accentColor}90` }}>"{finding.evidence}"</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Verdict + Recommendations */}
            <Card className={`glass-effect ${cardBorderClass}`}>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Verdict</span>
                  <p className="text-sm mt-1" style={{ color: accentColor }}>{data.verdict}</p>
                </div>
                <Separator className="opacity-20" />
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recommendations</span>
                  <ul className="mt-1 space-y-1">
                    {Array.isArray(data.recommendations) && data.recommendations.map((rec, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span style={{ color: accentColor }}>--</span> {rec}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex gap-2 pt-2">
                  <CopyButton text={data.receipts || data.verdict || ''} label="Copy Receipt" />
                  <Button variant="outline" size="sm" onClick={() => { setAnalystResult(null); setAnalystInput(''); setAnalystError(null) }} className="gap-1 text-xs">
                    <RefreshCw className="w-3 h-3" /> New Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════
  // ─── DUELIST SCREEN ────────────────────────────────
  // ═══════════════════════════════════════════════════
  function DuelistScreen() {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setCurrentScreen('dashboard')} className="gap-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div>
            <h2 className="text-xl font-bold" style={{ color: secondaryAccent }}>
              {isValentine ? 'Debate Arena' : 'Roast Colosseum'}
            </h2>
            <p className="text-xs text-muted-foreground">Enter a topic and watch two AI debaters battle it out</p>
          </div>
        </div>

        {/* Topic Input */}
        {debateRounds.length === 0 && (
          <Card className={`glass-effect ${cardBorderClass}`}>
            <CardContent className="pt-4 space-y-4">
              <Input
                placeholder={isValentine ? 'e.g., Is it worth risking a friendship for a romantic relationship?' : 'e.g., Are situationships just cowardice rebranded?'}
                value={debateTopic}
                onChange={(e) => setDebateTopic(e.target.value)}
                className="bg-transparent border-0 focus-visible:ring-1 text-sm"
                onKeyDown={(e) => { if (e.key === 'Enter' && !debateLoading) handleDebateStart() }}
              />
              <Button onClick={handleDebateStart} disabled={debateLoading || !debateTopic.trim()} className="gap-2" style={{ background: secondaryAccent, color: '#fff' }}>
                {debateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>}
                {debateLoading ? 'Setting Up...' : 'Start Debate'}
              </Button>
              {debateError && (
                <div className="flex items-center gap-2 text-xs text-destructive">
                  <AlertCircle className="w-3 h-3" /> {debateError}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Debate Rounds */}
        {Array.isArray(debateRounds) && debateRounds.map((round, ri) => (
          <div key={ri} className="space-y-4 animate-fade-in-up">
            {/* Round Header */}
            <div className="flex items-center gap-2">
              <Badge style={{ background: `${secondaryAccent}20`, color: secondaryAccent, borderColor: `${secondaryAccent}40` }}>
                Round {round.round ?? ri + 1} / {round.total_rounds ?? 3}
              </Badge>
              {round.topic && <span className="text-xs text-muted-foreground">{round.topic}</span>}
            </div>

            {/* Introduction */}
            {round.introduction && (
              <Card className="glass-effect border-0" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <CardContent className="py-3">
                  <p className="text-sm text-muted-foreground italic">{round.introduction}</p>
                </CardContent>
              </Card>
            )}

            {/* Debaters Split View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Debater A */}
              {round.debater_a && (
                <Card className="glass-effect neon-border-pink">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm neon-text-pink">{round.debater_a.name ?? 'Debater A'}</CardTitle>
                      <EmotionMeter level={round.debater_a.emotion_level ?? 5} color="#FF6496" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-muted-foreground leading-relaxed">{round.debater_a.argument}</p>
                    {Array.isArray(round.debater_a.key_points) && round.debater_a.key_points.length > 0 && (
                      <div className="mt-2">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Key Points</span>
                        <ul className="mt-1 space-y-1">
                          {round.debater_a.key_points.map((point, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="neon-text-pink text-[10px] mt-0.5">+</span> {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Debater B */}
              {round.debater_b && (
                <Card className="glass-effect neon-border-cyan">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm neon-text-cyan">{round.debater_b.name ?? 'Debater B'}</CardTitle>
                      <EmotionMeter level={round.debater_b.emotion_level ?? 5} color="#00FFFF" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-muted-foreground leading-relaxed">{round.debater_b.argument}</p>
                    {Array.isArray(round.debater_b.rebuttals) && round.debater_b.rebuttals.length > 0 && (
                      <div className="mt-2">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Rebuttals</span>
                        <ul className="mt-1 space-y-1">
                          {round.debater_b.rebuttals.map((rebuttal, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="neon-text-cyan text-[10px] mt-0.5">x</span> {rebuttal}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Round Summary */}
            {round.round_summary && (
              <Card className="glass-effect border-0" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <CardContent className="py-3">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Round Summary</span>
                  <p className="text-xs text-muted-foreground mt-1">{round.round_summary}</p>
                </CardContent>
              </Card>
            )}

            {/* Verdict */}
            {round.verdict && (round.verdict.winner || round.verdict.reasoning) && (
              <Card className="glass-effect neon-border-magenta">
                <CardContent className="py-3 space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-semibold neon-text-magenta">Verdict</span>
                  {round.verdict.winner && <p className="text-sm font-semibold" style={{ color: secondaryAccent }}>Winner: {round.verdict.winner}</p>}
                  {round.verdict.final_score && <p className="text-xs text-muted-foreground">Score: {round.verdict.final_score}</p>}
                  {round.verdict.reasoning && <p className="text-xs text-muted-foreground">{round.verdict.reasoning}</p>}
                  {round.verdict.audience_takeaway && (
                    <p className="text-xs italic" style={{ color: `${secondaryAccent}90` }}>{round.verdict.audience_takeaway}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ))}

        {/* Actions after debate */}
        {debateRounds.length > 0 && (
          <div className="flex gap-2">
            {debateRounds.length < 3 && (
              <Button onClick={handleDebateContinue} disabled={debateLoading} variant="outline" size="sm" className="gap-1 text-xs" style={{ borderColor: `${secondaryAccent}40`, color: secondaryAccent }}>
                {debateLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Next Round
              </Button>
            )}
            <CopyButton text={debateRounds.map(r => r.shareable_receipt || '').join('\n\n')} label="Share Debate" />
            <Button variant="outline" size="sm" onClick={() => { setDebateRounds([]); setDebateTopic(''); setDebateError(null) }} className="gap-1 text-xs">
              <RefreshCw className="w-3 h-3" /> New Debate
            </Button>
          </div>
        )}

        {debateError && debateRounds.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="w-3 h-3" /> {debateError}
          </div>
        )}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════
  // ─── CREATOR SCREEN ────────────────────────────────
  // ═══════════════════════════════════════════════════
  function CreatorScreen() {
    const chatEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [creatorMessages])

    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setCurrentScreen('dashboard')} className="gap-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div>
            <h2 className="text-xl font-bold neon-text-yellow">
              {isValentine ? 'Content Studio' : 'Manifesto Factory'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isValentine ? 'Create poetry, love letters, and sweet dedications' : 'Generate breakup anthems, roasts, and independence manifestos'}
            </p>
          </div>
        </div>

        {/* Start Button or Chat */}
        {!creatorStarted && !creatorResult && (
          <Card className={`glass-effect ${cardBorderClass}`}>
            <CardContent className="pt-6 pb-4 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-lg flex items-center justify-center mb-4" style={{ background: '#FFFF0010', border: '1px solid #FFFF0030' }}>
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#FFFF00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
                  <line x1="16" y1="8" x2="2" y2="22" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {isValentine ? 'I will interview you about your story, then craft a unique creative piece just for you.' : 'Tell me your story, and I will turn it into a powerful creative piece.'}
              </p>
              <Button onClick={handleCreatorStart} disabled={creatorLoading} className="gap-2" style={{ background: '#FFFF00', color: '#0d0a19' }}>
                {creatorLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {creatorLoading ? 'Starting...' : 'Begin Interview'}
              </Button>
              {creatorError && (
                <div className="flex items-center gap-2 text-xs text-destructive mt-3">
                  <AlertCircle className="w-3 h-3" /> {creatorError}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Chat Interface */}
        {creatorStarted && !creatorResult && (
          <Card className={`glass-effect ${cardBorderClass}`}>
            <CardContent className="pt-4 space-y-3">
              <ScrollArea className="h-64">
                <div className="space-y-3 pr-3">
                  {Array.isArray(creatorMessages) && creatorMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded text-xs ${msg.role === 'user' ? 'bg-primary/10 border border-primary/20' : ''}`} style={msg.role === 'agent' ? { background: 'rgba(255,255,0,0.05)', border: '1px solid rgba(255,255,0,0.15)' } : {}}>
                        {msg.role === 'agent' && <span className="text-[10px] font-semibold neon-text-yellow block mb-1">Creator Agent</span>}
                        <p className="text-muted-foreground leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  {creatorLoading && (
                    <div className="flex justify-start">
                      <div className="p-3 rounded text-xs" style={{ background: 'rgba(255,255,0,0.05)' }}>
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#FFFF00' }} />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  placeholder="Type your response..."
                  value={creatorInput}
                  onChange={(e) => setCreatorInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !creatorLoading) handleCreatorSend() }}
                  className="bg-transparent border-0 focus-visible:ring-1 text-sm flex-1"
                  disabled={creatorLoading}
                />
                <Button onClick={handleCreatorSend} disabled={creatorLoading || !creatorInput.trim()} size="sm" style={{ background: '#FFFF00', color: '#0d0a19' }}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {creatorError && (
                <div className="flex items-center gap-2 text-xs text-destructive">
                  <AlertCircle className="w-3 h-3" /> {creatorError}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Generated Content */}
        {creatorResult && (
          <div className="space-y-4 animate-fade-in-up">
            <Card className={`glass-effect ${cardBorderClass}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg" style={{ color: '#FFFF00' }}>{creatorResult.title ?? 'Untitled'}</CardTitle>
                    {creatorResult.dedication && <CardDescription className="text-xs mt-1 italic">{creatorResult.dedication}</CardDescription>}
                  </div>
                  {creatorResult.content_type && (
                    <Badge style={{ background: '#FFFF0020', color: '#FFFF00', borderColor: '#FFFF0040' }}>
                      {creatorResult.content_type}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded whitespace-pre-wrap text-sm leading-relaxed" style={{ background: 'rgba(255,255,255,0.03)', color: 'hsl(180, 100%, 70%)' }}>
                  {creatorResult.content}
                </div>

                {/* Mood Tags */}
                {Array.isArray(creatorResult.mood_tags) && creatorResult.mood_tags.length > 0 && (
                  <div className="flex gap-1.5 mt-3">
                    {creatorResult.mood_tags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]" style={{ borderColor: '#FFFF0030', color: '#FFFF00' }}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Shareable Quote */}
                {creatorResult.shareable_quote && (
                  <div className="mt-4 p-3 rounded" style={{ background: `${accentColor}08`, borderLeft: `2px solid ${accentColor}` }}>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Featured Quote</span>
                    <p className="text-sm italic" style={{ color: accentColor }}>"{creatorResult.shareable_quote}"</p>
                  </div>
                )}

                {/* Image Prompt */}
                {creatorResult.image_prompt && (
                  <div className="mt-3 p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Visual Prompt</span>
                    <p className="text-xs text-muted-foreground mt-1">{creatorResult.image_prompt}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="gap-2">
                <CopyButton text={creatorResult.content ?? ''} label="Copy Content" />
                {creatorResult.shareable_quote && (
                  <CopyButton text={creatorResult.shareable_quote} label="Copy Quote" />
                )}
                <Button variant="outline" size="sm" onClick={() => { setCreatorResult(null); setCreatorMessages([]); setCreatorStarted(false); setCreatorInput(''); setCreatorError(null) }} className="gap-1 text-xs">
                  <RefreshCw className="w-3 h-3" /> New Creation
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════
  // ─── REPORT SCREEN ─────────────────────────────────
  // ═══════════════════════════════════════════════════
  function ReportScreen() {
    const report = vibeReport || (showSampleData ? SAMPLE_VIBE_REPORT : null)
    if (!report) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-6 relative z-10">
          <Button variant="ghost" size="sm" onClick={() => setCurrentScreen('dashboard')} className="gap-1 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <Card className={`glass-effect ${cardBorderClass}`}>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Report not yet generated. Complete all 3 apps first.</p>
            </CardContent>
          </Card>
        </div>
      )
    }

    const breakdown = report.score_breakdown

    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setCurrentScreen('dashboard')} className="gap-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <h2 className="text-xl font-bold" style={{ color: accentColor, textShadow: `0 0 20px ${accentGlow}` }}>
            Ultimate Vibe Report
          </h2>
        </div>

        {/* Main Score */}
        <Card className={`glass-effect ${cardBorderClass} ${pulseClass}`}>
          <CardContent className="py-8 flex flex-col items-center">
            <ScoreDisplay score={report.vibe_score ?? 0} label="Overall Vibe Score" mode={currentMode} />
            {report.personality_type && (
              <div className="mt-4 text-center">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Your Personality Type</span>
                <p className="text-2xl font-bold mt-1" style={{ color: secondaryAccent, textShadow: `0 0 12px ${secondaryAccent}40` }}>
                  {report.personality_type}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Score Breakdown */}
        {breakdown && (
          <Card className={`glass-effect ${cardBorderClass}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: accentColor }}>Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <VibeBar label="Romance Quotient" value={breakdown.romance_quotient ?? 0} color="#FF6496" />
              <VibeBar label="Independence Index" value={breakdown.independence_index ?? 0} color="#00FFFF" />
              <VibeBar label="Creativity Spark" value={breakdown.creativity_spark ?? 0} color="#FFFF00" />
              <VibeBar label="Debate Prowess" value={breakdown.debate_prowess ?? 0} color="#E600E6" />
            </CardContent>
          </Card>
        )}

        {/* Insights + Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.isArray(report.insights) && report.insights.length > 0 && (
            <Card className={`glass-effect ${cardBorderClass}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm" style={{ color: accentColor }}>Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span style={{ color: accentColor }}>--</span> {insight}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {Array.isArray(report.recommendations) && report.recommendations.length > 0 && (
            <Card className={`glass-effect ${cardBorderClass}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm" style={{ color: secondaryAccent }}>Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span style={{ color: secondaryAccent }}>--</span> {rec}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Fun Stats */}
        <Card className={`glass-effect ${cardBorderClass}`}>
          <CardContent className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {report.spirit_animal && (
                <div className="text-center p-3 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Spirit Animal</span>
                  <p className="text-sm font-bold" style={{ color: '#FFFF00' }}>{report.spirit_animal}</p>
                </div>
              )}
              {report.playlist_mood && (
                <div className="text-center p-3 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Playlist Mood</span>
                  <p className="text-sm font-bold" style={{ color: '#E600E6' }}>{report.playlist_mood}</p>
                </div>
              )}
              {report.viral_caption && (
                <div className="text-center p-3 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Viral Caption</span>
                  <p className="text-xs italic" style={{ color: accentColor }}>{report.viral_caption}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Final Verdict */}
        {report.final_verdict && (
          <Card className={`glass-effect ${cardBorderClass}`} style={{ background: `linear-gradient(135deg, rgba(0,255,255,0.05), rgba(230,0,230,0.05))` }}>
            <CardContent className="py-4 text-center">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">The Final Verdict</span>
              <p className="text-sm leading-relaxed max-w-lg mx-auto" style={{ color: accentColor }}>{report.final_verdict}</p>
            </CardContent>
          </Card>
        )}

        {/* Share */}
        <div className="flex justify-center gap-2">
          <CopyButton
            text={`VibeSplit Vibe Report\nScore: ${report.vibe_score ?? 0}/100\nPersonality: ${report.personality_type ?? ''}\n${report.viral_caption ?? ''}\n${report.final_verdict ?? ''}`}
            label="Share Report"
          />
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════
  // ─── RENDER ─────────────────────────────────────────
  // ═══════════════════════════════════════════════════
  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground mode={currentMode} />

      {currentScreen === 'dashboard' && <DashboardScreen />}
      {currentScreen === 'analyst' && <AnalystScreen />}
      {currentScreen === 'duelist' && <DuelistScreen />}
      {currentScreen === 'creator' && <CreatorScreen />}
      {currentScreen === 'report' && <ReportScreen />}

      <TerminalSidebar
        thoughts={terminalThoughts}
        isOpen={terminalOpen}
        onToggle={() => setTerminalOpen(prev => !prev)}
        mode={currentMode}
      />
    </div>
  )
}
