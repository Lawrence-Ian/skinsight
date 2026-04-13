import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { historyAPI } from '../utils/api'
import { Sun, Moon, ShoppingBag, Lightbulb, AlertTriangle, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react'

const META = {
  acne:            { bg:'#FFE4E1', border:'#FFB2B2', color:'#C0504D', emoji:'🔴' },
  oily:            { bg:'#FFF9E6', border:'#FFE082', color:'#B8860B', emoji:'✨' },
  dry:             { bg:'#E8F4FD', border:'#90CAF9', color:'#1565C0', emoji:'💙' },
  normal:          { bg:'#E8F5E9', border:'#A5D6A7', color:'#2E7D32', emoji:'💚' },
}

function RoutineDetail({ routine, onBack }) {
  const m = META[routine.condition] || META.normal
  const [expandedSections, setExpandedSections] = useState({
    morning: true,
    night: true,
    products: true,
    tips: false,
    avoid: false,
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  return (
    <div className="px-4 sm:px-5 py-4 sm:py-5 space-y-4 anim-fadeup">
      
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-2 text-skin-muted hover:text-skin-text text-sm font-medium">
        <ArrowLeft size={17} /> Back to Routines
      </button>

      {/* Header */}
      <div className="rounded-2xl p-4 sm:p-5 overflow-hidden" style={{ backgroundColor: m.bg, borderLeft: `5px solid ${m.color}` }}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{m.emoji}</span>
          <div className="flex-1">
            <h1 className="font-bold text-base sm:text-lg" style={{ color: m.color }}>
              {routine.condition_label}
            </h1>
            <p className="text-xs text-skin-muted mt-1">{routine.description}</p>
          </div>
        </div>
        {routine.severity && (
          <div className="mt-3 inline-block px-3 py-1 rounded-full text-xs font-semibold" 
               style={{ backgroundColor: m.color + '20', color: m.color }}>
            Severity: {routine.severity}
          </div>
        )}
      </div>

      {/* Morning Routine Section */}
      <div className="card">
        <button onClick={() => toggleSection('morning')} className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: m.bg }}>
              <Sun size={20} style={{ color: m.color }} />
            </div>
            <span className="font-bold text-sm" style={{ color: m.color }}>Morning Routine</span>
          </div>
          {expandedSections.morning ? (
            <ChevronUp size={18} style={{ color: m.color }} />
          ) : (
            <ChevronDown size={18} style={{ color: m.color }} />
          )}
        </button>
        {expandedSections.morning && (
          <div className="mt-4 pt-4 border-t border-skin-border">
            <ol className="space-y-3">
              {routine.morning_routine.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
                        style={{ backgroundColor: m.color }}>
                    {i + 1}
                  </span>
                  <span className="text-sm text-skin-text leading-relaxed mt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Night Routine Section */}
      <div className="card">
        <button onClick={() => toggleSection('night')} className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: m.bg }}>
              <Moon size={20} style={{ color: m.color }} />
            </div>
            <span className="font-bold text-sm" style={{ color: m.color }}>Night Routine</span>
          </div>
          {expandedSections.night ? (
            <ChevronUp size={18} style={{ color: m.color }} />
          ) : (
            <ChevronDown size={18} style={{ color: m.color }} />
          )}
        </button>
        {expandedSections.night && (
          <div className="mt-4 pt-4 border-t border-skin-border">
            <ol className="space-y-3">
              {routine.night_routine.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
                        style={{ backgroundColor: m.color }}>
                    {i + 1}
                  </span>
                  <span className="text-sm text-skin-text leading-relaxed mt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Recommended Products */}
      {routine.products && routine.products.length > 0 && (
        <div className="card">
          <button onClick={() => toggleSection('products')} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: m.bg }}>
                <ShoppingBag size={20} style={{ color: m.color }} />
              </div>
              <span className="font-bold text-sm" style={{ color: m.color }}>Recommended Products</span>
            </div>
            {expandedSections.products ? (
              <ChevronUp size={18} style={{ color: m.color }} />
            ) : (
              <ChevronDown size={18} style={{ color: m.color }} />
            )}
          </button>
          {expandedSections.products && (
            <div className="mt-4 pt-4 border-t border-skin-border space-y-3">
              {routine.products.map((product, i) => (
                <div key={i} className="rounded-xl p-4 border-2" style={{
                  backgroundColor: m.bg + '30',
                  borderColor: m.color + '40'
                }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-sm text-skin-text">{product.name}</p>
                      {product.brand && (
                        <p className="text-xs font-semibold mt-0.5" style={{ color: m.color }}>{product.brand}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-skin-muted mb-2">{product.ingredient}</p>
                  <p className="text-xs font-medium" style={{ color: m.color }}>→ {product.purpose}</p>
                  {product.dermatologist_recommendation && (
                    <div className="mt-2 pt-2 border-t" style={{ borderColor: m.color + '30' }}>
                      <p className="text-xs" style={{ color: m.color }}>
                        <span className="font-semibold">💊 Dermatologist Note: </span>
                        {product.dermatologist_recommendation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preventive Tips */}
      {routine.preventive_tips && routine.preventive_tips.length > 0 && (
        <div className="card">
          <button onClick={() => toggleSection('tips')} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: m.bg }}>
                <Lightbulb size={20} style={{ color: m.color }} />
              </div>
              <span className="font-bold text-sm" style={{ color: m.color }}>Preventive Tips</span>
            </div>
            {expandedSections.tips ? (
              <ChevronUp size={18} style={{ color: m.color }} />
            ) : (
              <ChevronDown size={18} style={{ color: m.color }} />
            )}
          </button>
          {expandedSections.tips && (
            <div className="mt-4 pt-4 border-t border-skin-border">
              <ul className="space-y-2">
                {routine.preventive_tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-sm text-skin-text">
                    <span style={{ color: m.color }}>✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Ingredients to Avoid */}
      {routine.ingredients_to_avoid && routine.ingredients_to_avoid.length > 0 && (
        <div className="card">
          <button onClick={() => toggleSection('avoid')} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: m.bg }}>
                <AlertTriangle size={20} style={{ color: m.color }} />
              </div>
              <span className="font-bold text-sm" style={{ color: m.color }}>Ingredients to Avoid</span>
            </div>
            {expandedSections.avoid ? (
              <ChevronUp size={18} style={{ color: m.color }} />
            ) : (
              <ChevronDown size={18} style={{ color: m.color }} />
            )}
          </button>
          {expandedSections.avoid && (
            <div className="mt-4 pt-4 border-t border-skin-border flex flex-wrap gap-2">
              {routine.ingredients_to_avoid.map((ing, i) => (
                <span key={i} className="px-3 py-1.5 text-xs rounded-full font-semibold"
                      style={{ backgroundColor: m.color + '20', color: m.color }}>
                  ✗ {ing}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {routine.consult_dermatologist && (
        <div className="rounded-2xl p-5 border-2" style={{ backgroundColor: m.bg, borderColor: m.color }}>
          <p className="text-sm font-semibold" style={{ color: m.color }}>
            ⚕️ We recommend consulting a board-certified dermatologist for this condition.
          </p>
        </div>
      )}

      <div className="pb-6" />
    </div>
  )
}

export default function RoutinePage() {
  const nav = useNavigate()
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedScan, setSelectedScan] = useState(null)
  const [selectedRoutine, setSelectedRoutine] = useState(null)

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const res = await historyAPI.getAll()
        setScans(res.data.history || [])
      } catch (err) {
        setError('Failed to load routines')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchScans()
  }, [])

  const handleSelectScan = async (scan) => {
    try {
      const res = await historyAPI.get(scan.id)
      setSelectedRoutine(res.data)
      setSelectedScan(scan)
    } catch (err) {
      console.error('Failed to load routine:', err)
    }
  }

  if (loading) return (
    <div className="app-screen flex items-center justify-center bg-skin-bg">
      <div className="w-10 h-10 rounded-full border-4 border-skin-a2 border-t-transparent animate-spin" />
    </div>
  )

  if (error) return (
    <div className="app-screen flex items-center justify-center bg-skin-bg text-skin-text">
      <div className="text-center">
        <p className="text-xl font-bold">{error}</p>
        <button onClick={() => nav('/dashboard')} className="btn-primary mt-4 px-8 py-2.5">
          Back to Dashboard
        </button>
      </div>
    </div>
  )

  // Show selected routine detail
  if (selectedRoutine) {
    return <RoutineDetail routine={selectedRoutine} onBack={() => { setSelectedRoutine(null); setSelectedScan(null) }} />
  }

  // Show empty state
  if (scans.length === 0) {
    return (
      <div className="app-screen flex items-center justify-center bg-skin-bg text-skin-text px-5">
        <div className="text-center">
          <p className="text-xl font-bold mb-2">No Routines Yet</p>
          <p className="text-skin-muted mb-6">Perform a skin scan to get personalized skincare routines</p>
          <button onClick={() => nav('/dashboard')} className="btn-primary px-8 py-2.5">
            Start Scanning
          </button>
        </div>
      </div>
    )
  }

  // Show scan list
  return (
    <div className="px-4 sm:px-5 py-4 sm:py-5 space-y-4 anim-fadeup">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-skin-text mb-2">Your Routines</h1>
        <p className="text-skin-muted">Select a scan to view your personalized routine</p>
      </div>

      <div className="space-y-3">
        {scans.map((scan) => {
          const m = META[scan.condition] || META.normal
          const date = new Date(scan.created_at)
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

          return (
            <button
              key={scan.id}
              onClick={() => handleSelectScan(scan)}
              className="w-full rounded-2xl p-4 border-2 transition-all hover:shadow-md active:scale-95"
              style={{
                backgroundColor: m.bg,
                borderColor: m.color + '40'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 text-left">
                  <span className="text-3xl">{m.emoji}</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-skin-text">{scan.condition}</p>
                    <p className="text-xs text-skin-muted mt-0.5">{dateStr} at {timeStr}</p>
                    <p className="text-xs font-semibold mt-1" style={{ color: m.color }}>
                      Confidence: {scan.confidence_percent}%
                    </p>
                  </div>
                </div>
                <ChevronDown size={20} style={{ color: m.color }} className="rotate-[-90deg]" />
              </div>
            </button>
          )
        })}
      </div>

      <div className="pb-6" />
    </div>
  )
}
