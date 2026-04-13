// src/pages/AuthPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft, Sparkles } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { authAPI } from '../utils/api'

export default function AuthPage() {
  const [mode, setMode]       = useState('login')
  const [form, setForm]       = useState({ name: '', email: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const { login } = useAuth()
  const nav = useNavigate()

  const onChange = e => { setForm(f => ({ ...f, [e.target.name]: e.target.value })); setError('') }

  const submit = async e => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const trimmed = {
        name: form.name?.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password
      };
      const res = mode === 'signup' ? await authAPI.signup(trimmed) : await authAPI.login(trimmed)
      login(res.data.user, res.data.token)
      console.log('Auth success, delaying nav...')
      setTimeout(() => nav('/dashboard'), 100)
    } catch (err) {
      console.error('Auth error:', err.response?.data || err.message);
      setError(err.response?.data?.detail || 'Something went wrong.')
    } finally { setLoading(false) }
  }

  return (
    <div className="app-screen bg-skin-bg flex flex-col">
      <div className="px-4 sm:px-6 pt-8 sm:pt-10 pb-8 flex-1 flex flex-col">
        <button onClick={() => nav('/')} className="flex items-center gap-2 text-skin-muted hover:text-skin-text transition-colors mb-8 w-fit">
          <ArrowLeft size={18} /><span className="text-sm font-medium">Back</span>
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-7">
          <div className="w-12 h-12 rounded-2xl bg-skin-a2 flex items-center justify-center shadow-md">
            <Sparkles size={22} className="text-white" />
          </div>
          <div>
            <p className="font-display text-xl font-bold text-skin-text">SKINSIGHT</p>
            <p className="text-xs text-skin-muted">Your skin story starts here</p>
          </div>
        </div>

        <h2 className="font-display text-3xl font-bold text-skin-text">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h2>
        <p className="text-skin-muted text-sm mt-1 mb-7">
          {mode === 'login' ? 'Sign in to continue your skin journey' : 'Join and start scanning your skin live'}
        </p>

        <form onSubmit={submit} className="space-y-4 flex-1">
          {mode === 'signup' && (
            <div className="anim-fadeup">
              <label className="block text-sm font-medium mb-1.5">Full Name</label>
              <input name="name" value={form.name} onChange={onChange} placeholder="Your name" required className="input-field" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input name="email" type="email" value={form.email} onChange={onChange} placeholder="hello@example.com" required className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <div className="relative">
              <input name="password" type={showPw ? 'text' : 'password'} value={form.password}
                onChange={onChange} placeholder="••••••••" required minLength={6} className="input-field pr-12" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-skin-muted hover:text-skin-text">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-skin-a1 bg-opacity-30 border border-skin-a1 rounded-2xl p-3">
              <p className="text-skin-a2 text-sm font-medium">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
            {loading
              ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-skin-border" />
            <span className="text-xs text-skin-muted">or</span>
            <div className="flex-1 h-px bg-skin-border" />
          </div>
          <p className="text-center text-sm text-skin-muted">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError('') }}
              className="text-skin-a2 font-bold hover:underline">
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
          <div className="card-soft text-center text-xs text-skin-muted">
            💡 <strong>Demo:</strong> Register any email + 6-char password to explore
          </div>
        </div>
      </div>
    </div>
  )
}
