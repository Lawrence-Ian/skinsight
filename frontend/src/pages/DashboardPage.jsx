// src/pages/DashboardPage.jsx
// LIVE CAMERA ONLY — no file upload whatsoever
import { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, RefreshCw, Zap, ShieldCheck, Info, FlipHorizontal } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { analysisAPI } from '../utils/api'

const COUNTDOWN_SEC = 3

export default function DashboardPage() {
  const { user }          = useAuth()
  const navigate          = useNavigate()
  const videoRef          = useRef(null)
  const canvasRef         = useRef(null)
  const streamRef         = useRef(null)

  const [camState, setCamState]   = useState('idle')   // idle | requesting | live | countdown | capturing | error
  const [facingMode, setFacingMode] = useState('user')
  const [countdown, setCountdown]   = useState(0)
  const [analyzing, setAnalyzing]   = useState(false)
  const [error, setError]           = useState('')
  const [camError, setCamError]     = useState('')
  const [tip, setTip]               = useState(0)

  const TIPS = [
    'Position your face inside the oval',
    'Find good natural lighting',
    'Hold your device at arm\'s length',
    'Look straight into the camera',
    'Remove glasses for best results',
  ]

  useEffect(() => {
    const t = setInterval(() => setTip(i => (i + 1) % TIPS.length), 3500)
    return () => clearInterval(t)
  }, [])

  // ── Start camera ─────────────────────────────────────────────────────────
  const startCamera = useCallback(async (facing = facingMode) => {
    setError(''); setCamError('')
    setCamState('requesting')

    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }

    try {
      // Try with flexible constraints first (mobile compatibility)
      let constraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      }

      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch (firstErr) {
        console.warn('Constraints failed, trying basic video request:', firstErr.name)
        // Fallback: try with minimal constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false,
        })
      }
      
      if (!stream) {
        throw new Error('Failed to get camera stream')
      }

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        try {
          await videoRef.current.play()
        } catch (playErr) {
          console.error('Video play error:', playErr)
        }
      }
      setCamState('live')
    } catch (err) {
      // Provide specific error messages
      let msg = ''
      
      if (err.name === 'NotAllowedError') {
        msg = 'Camera permission denied. Please allow camera access in your browser settings.'
      } else if (err.name === 'NotFoundError') {
        msg = 'No camera found on this device.'
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Camera is already in use. Close other camera apps and try again.'
      } else if (err.name === 'SecurityError') {
        msg = 'Camera access blocked by browser security. Check your site is using HTTPS or localhost.'
      } else if (err.name === 'OverconstrainedError') {
        msg = 'Camera does not support the requested resolution. Please try again.'
      } else {
        msg = `Camera error: ${err.message || err.name || 'Unknown error'}`
      }
      
      console.error('Camera error details:', err.name, err.message)
      setCamError(msg)
      setCamState('error')
    }
  }, [facingMode])

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [])

  // ── Flip camera ───────────────────────────────────────────────────────────
  const flipCamera = () => {
    const next = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(next)
    startCamera(next)
  }

  // ── Capture after countdown ───────────────────────────────────────────────
  const beginCapture = () => {
    if (camState !== 'live') return
    setCamState('countdown')
    let count = COUNTDOWN_SEC
    setCountdown(count)
    const t = setInterval(() => {
      count -= 1
      if (count <= 0) {
        clearInterval(t)
        setCountdown(0)
        captureAndAnalyze()
      } else {
        setCountdown(count)
      }
    }, 1000)
  }

  // ── Capture frame & send to backend ──────────────────────────────────────
  const captureAndAnalyze = async () => {
    setCamState('capturing')
    setAnalyzing(true)
    setError('')

    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) { setError('Camera not ready.'); setAnalyzing(false); setCamState('live'); return }

    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')

    // Mirror the capture if using front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get base64 JPEG
    const frame = canvas.toDataURL('image/jpeg', 0.88)

    try {
      const res = await analysisAPI.scanFrame(frame)
      navigate('/result', { state: { result: res.data } })
    } catch (err) {
      const msg = err.response?.data?.detail || 'Analysis failed. Please try again.'
      setError(msg)
      setCamState('live')
    } finally {
      setAnalyzing(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="px-4 sm:px-5 py-4 sm:py-5 space-y-4 sm:space-y-5 anim-fadeup">
      {/* Greeting */}
      <div>
        <p className="text-skin-muted text-sm">Good day,</p>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-skin-text">{user?.name?.split(' ')[0]} ✨</h1>
        <p className="text-skin-muted text-sm mt-0.5">Point your camera at your face and scan live.</p>
      </div>

      {/* Tip strip */}
      <div className="card-soft flex items-center gap-3 py-3">
        <Info size={16} className="text-skin-a2 flex-shrink-0" />
        <p className="text-xs text-skin-muted transition-all duration-500">{TIPS[tip]}</p>
      </div>

      {/* Mobile HTTPS notice */}
      {typeof window !== 'undefined' && window.location.protocol === 'http:' && !window.location.hostname.includes('localhost') && (
        <div className="card-soft border border-skin-a1/20 flex items-start gap-3 py-3">
          <Info size={16} className="text-skin-a1 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-skin-muted">
            <p className="font-medium text-skin-a1 mb-1">Mobile users: Use HTTPS</p>
            <p>For camera access on mobile devices, your connection must be secure (HTTPS). Contact your admin to enable HTTPS or test on <code className="text-xs bg-white/5 px-1 rounded">localhost</code>.</p>
          </div>
        </div>
      )}

      {/* ── Camera Viewfinder ── */}
      <div className="relative w-full max-w-[18.5rem] sm:max-w-[21rem] mx-auto aspect-[3/4] rounded-3xl overflow-hidden bg-zinc-900 shadow-[0_8px_40px_rgba(61,43,31,0.18)]">

        {/* Video element — always in DOM */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none', display: (camState === 'live' || camState === 'countdown') ? 'block' : 'none' }}
          onLoadedMetadata={() => console.log('Video metadata loaded')}
          onError={(e) => console.error('Video element error:', e)}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Idle state */}
        {camState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-zinc-900">
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
              <Camera size={42} className="text-white/70" />
            </div>
            <div className="text-center px-8">
              <p className="text-white font-semibold text-lg">Live Camera</p>
              <p className="text-white/50 text-sm mt-1">Tap below to start your skin scan</p>
            </div>
            <button onClick={() => startCamera()} className="btn-primary px-8 py-3 flex items-center gap-2 text-sm">
              <Camera size={16} /> Start Camera
            </button>
          </div>
        )}

        {/* Requesting permission */}
        {camState === 'requesting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-900">
            <div className="w-10 h-10 rounded-full border-3 border-skin-a1 border-t-transparent animate-spin" />
            <p className="text-white/70 text-sm">Requesting camera access…</p>
          </div>
        )}

        {/* Camera error */}
        {camState === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-900 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-skin-a1/20 flex items-center justify-center">
              <Camera size={28} className="text-skin-a1" />
            </div>
            <p className="text-white/80 text-sm leading-relaxed">{camError}</p>
            <button onClick={() => startCamera()} className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2">
              <RefreshCw size={14} /> Try Again
            </button>
          </div>
        )}

        {/* Oval face guide + scan line — shown when camera is live or in countdown */}
        {(camState === 'live' || camState === 'countdown') && (
          <>
            {/* Dark vignette cutout */}
            <div className="camera-oval" />

            {/* Scan line inside oval */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative" style={{ width: '70%', aspectRatio: '3/4' }}>
                <div className="scan-line absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-skin-a2 to-transparent opacity-80" />
              </div>
            </div>

            {/* Corner brackets */}
            {[['top-[11%] left-[13%]','border-t-2 border-l-2'],
              ['top-[11%] right-[13%]','border-t-2 border-r-2'],
              ['bottom-[11%] left-[13%]','border-b-2 border-l-2'],
              ['bottom-[11%] right-[13%]','border-b-2 border-r-2']
            ].map(([pos, border], i) => (
              <div key={i} className={`absolute w-6 h-6 ${pos} ${border} border-skin-a2 opacity-90`} />
            ))}

            {/* Flip button */}
            <button onClick={flipCamera}
              className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors">
              <FlipHorizontal size={18} />
            </button>

            {/* Countdown overlay */}
            {camState === 'countdown' && countdown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative flex items-center justify-center">
                  <div className="ripple-ring absolute w-32 h-32 rounded-full border-4 border-skin-a2" />
                  <div className="ripple-ring absolute w-32 h-32 rounded-full border-4 border-skin-a1" style={{ animationDelay: '0.6s' }} />
                  <div className="w-24 h-24 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center">
                    <span className="font-display text-6xl font-bold text-white leading-none">{countdown}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Status chip */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400 pulse-dot" />
              <span className="text-white text-xs font-semibold">LIVE</span>
            </div>
          </>
        )}

        {/* Analyzing overlay */}
        {camState === 'capturing' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-skin-a1 border-t-skin-a2 animate-spin" />
            <div className="text-center">
              <p className="text-white font-semibold">Analyzing your skin…</p>
              <p className="text-white/60 text-sm mt-1">Running CNN model</p>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Action buttons */}
      {(camState === 'live') && (
        <button onClick={beginCapture} disabled={analyzing}
          className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-base anim-fadeup">
          <Zap size={20} />
          Capture & Analyze Skin
        </button>
      )}

      {camState === 'idle' && (
        <div className="text-center text-xs text-skin-muted py-2">
          Camera permission required for live analysis
        </div>
      )}

      {/* Feature chips */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {[
          { icon: '🔬', label: 'CNN Model'     },
          { icon: '⚡', label: 'Instant Scan'  },
          { icon: '🧴', label: 'Routines'      },
        ].map(({ icon, label }) => (
          <div key={label} className="card-soft text-center py-4">
            <p className="text-2xl mb-1">{icon}</p>
            <p className="text-xs font-medium text-skin-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Privacy */}
      <div className="flex items-center justify-center gap-2 pb-2">
        <ShieldCheck size={13} className="text-skin-muted" />
        <p className="text-xs text-skin-muted">Live frames are analyzed and never stored</p>
      </div>
    </div>
  )
}
