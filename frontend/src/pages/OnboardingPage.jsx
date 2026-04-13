// src/pages/OnboardingPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Star, History, ArrowRight, ChevronRight } from 'lucide-react'

const SLIDES = [
  {
    Icon: Camera, accent: '#E36A6A', bg: '#FFB2B2',
    eyebrow: 'Powered by deep learning',
    title: 'Live Camera\nSkin Analysis',
    body: 'No photo uploads. Your camera scans your skin in real-time — our CNN model detects acne, oiliness, dryness, and more in seconds.',
    cta: 'Next',
  },
  {
    Icon: Star, accent: '#C4773A', bg: '#FFD4A8',
    eyebrow: 'Curated for your skin',
    title: 'Personalized\nSkincare Routine',
    body: 'Get a custom morning & night routine, product picks, preventive tips — all based on your live scan.',
    cta: 'Next',
  },
  {
    Icon: History, accent: '#4CAF50', bg: '#C8E6C9',
    eyebrow: 'Track your progress',
    title: 'Scan History\n& Recommendations',
    body: 'Access all your past scans and personalized routines anytime. Track how your skin changes over time with detailed recommendations.',
    cta: 'Get Started',
  },
]

export default function OnboardingPage() {
  const [idx, setIdx] = useState(0)
  const nav = useNavigate()
  const s = SLIDES[idx]
  const { Icon } = s

  const next = () => idx < SLIDES.length - 1 ? setIdx(i => i + 1) : nav('/auth')

  return (
    <div className="app-screen bg-skin-bg flex flex-col px-4 sm:px-6 py-8 sm:py-10">
      <div className="flex justify-end">
        <button onClick={() => nav('/auth')} className="text-sm text-skin-muted font-medium hover:text-skin-text transition-colors">Skip</button>
      </div>

      {/* Illustration */}
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 sm:gap-8">
        <div className="relative flex items-center justify-center">
          {/* Rings */}
          <div className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full border-2 border-dashed spin-slow opacity-25"
               style={{ borderColor: s.accent }} />
          <div className="absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full border opacity-10"
               style={{ borderColor: s.accent }} />
          {/* Icon circle */}
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center transition-all duration-500 anim-fadeup"
               style={{ backgroundColor: s.bg }}>
            <Icon size={46} style={{ color: s.accent }} strokeWidth={1.4} />
          </div>
        </div>

        <div className="space-y-3 anim-fadeup max-w-xs">
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: s.accent }}>{s.eyebrow}</p>
          <h1 className="font-display text-[1.8rem] sm:text-[2.1rem] font-bold text-skin-text leading-tight whitespace-pre-line">{s.title}</h1>
          <p className="text-skin-muted text-[0.95rem] leading-relaxed">{s.body}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-5 pb-4">
        <div className="flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className="rounded-full h-2 transition-all duration-300"
              style={{ width: i === idx ? 28 : 8, backgroundColor: i === idx ? s.accent : '#F0DEB8' }} />
          ))}
        </div>
        <button onClick={next}
          className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-all duration-200"
          style={{ backgroundColor: s.accent }}>
          {s.cta}
          {idx < SLIDES.length - 1 ? <ChevronRight size={18} /> : <ArrowRight size={18} />}
        </button>
        {idx === SLIDES.length - 1 && (
          <p className="text-center text-xs text-skin-muted">By continuing you agree to our Terms & Privacy Policy</p>
        )}
      </div>
    </div>
  )
}
