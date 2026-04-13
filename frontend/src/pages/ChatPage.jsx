// src/pages/ChatPage.jsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, RotateCcw, Sparkles, MapPin } from 'lucide-react'
import { chatAPI } from '../utils/api'

const QUICK = ['How to treat acne?','Best sunscreen tips','What is retinol?','Night skincare routine','Foods for healthy skin','How does the camera scan work?']

const INIT = [{
  id: 1, role:'bot',
  text:"Hi! 🌸 I'm **Sage**, your SKINSIGHT skincare assistant.\n\nAsk me anything about skincare, or head to the **Scan** tab to analyze your skin live with the camera!",
  time: new Date()
}]

const fmt = t => t.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>')

export default function ChatPage() {
  const navigate = useNavigate()
  const [msgs, setMsgs]       = useState(INIT)
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef()
  const inputRef  = useRef()

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [msgs])

  const send = async (text) => {
    const m = text || input.trim()
    if (!m || loading) return
    setInput('')
    setMsgs(p => [...p, { id: Date.now(), role:'user', text: m, time: new Date() }])
    setLoading(true)
    try {
      const r = await chatAPI.message(m)
      setMsgs(p => [...p, { id: Date.now()+1, role:'bot', text: r.data.response, time: new Date() }])
      if (r.data.response.includes('MAP ACTIVATED')) {
        navigate('/map')
      }
    } catch {
      setMsgs(p => [...p, { id: Date.now()+1, role:'bot', text:"Connection issue 😓 Please try again.", time: new Date() }])
    } finally { setLoading(false); inputRef.current?.focus() }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Chat header */}
      <div className="px-4 sm:px-5 py-3 border-b border-skin-border flex items-center justify-between bg-skin-bg gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-skin-a1/40 flex items-center justify-center">
            <Sparkles size={17} className="text-skin-a2" />
          </div>
          <div>
            <p className="font-semibold text-skin-text">Sage</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <p className="text-xs text-skin-muted">Skincare AI Assistant</p>
            </div>
          </div>
        </div>
        <button onClick={() => setMsgs(INIT)}
          className="w-9 h-9 rounded-xl bg-skin-card border border-skin-border flex items-center justify-center hover:bg-skin-a1/30 transition-colors">
          <RotateCcw size={14} className="text-skin-muted" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3.5 flex flex-col gap-4">
        {msgs.map(msg => (
          <div key={msg.id} className={`flex flex-col gap-1 anim-fadeup ${msg.role==='user' ? 'items-end' : 'items-start'}`}>
            {msg.role==='bot' && (
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-5 h-5 rounded-full bg-skin-a1/40 flex items-center justify-center">
                  <Sparkles size={10} className="text-skin-a2" />
                </div>
                <span className="text-xs font-medium text-skin-muted">Sage</span>
              </div>
            )}
            <div className={msg.role==='user' ? 'bubble-user' : 'bubble-bot'}
              dangerouslySetInnerHTML={{ __html: fmt(msg.text) }} />
            <p className="text-[10px] text-skin-muted px-1">
              {msg.time.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
            </p>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2 anim-fadein">
            <div className="w-5 h-5 rounded-full bg-skin-a1/40 flex items-center justify-center mt-0.5">
              <Sparkles size={10} className="text-skin-a2" />
            </div>
            <div className="bubble-bot flex items-center gap-1.5">
              {[0,150,300].map(d => (
                <div key={d} className="w-2 h-2 rounded-full bg-skin-muted animate-bounce" style={{ animationDelay:`${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {msgs.length <= 2 && (
        <div className="px-4 sm:px-5 pb-2">
          <p className="text-xs text-skin-muted mb-2 font-medium">Quick questions:</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK.map(q => (
              <button key={q} onClick={() => send(q)}
                className="text-xs px-2.5 sm:px-3 py-1.5 rounded-full bg-skin-card border border-skin-border text-skin-muted hover:border-skin-a2 hover:text-skin-a2 transition-all">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 sm:px-5 pt-2 border-t border-skin-border bg-skin-bg pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-2.5 bg-white rounded-2xl border border-skin-border px-4 py-2.5 shadow-sm">
          <textarea ref={inputRef} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()} }}
            onInput={e => { e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,96)+'px' }}
            placeholder="Ask about skincare…" rows={1}
            className="flex-1 bg-transparent text-sm text-skin-text placeholder-skin-muted resize-none outline-none leading-relaxed" />
          <button onClick={() => send()} disabled={!input.trim()||loading}
            className="w-9 h-9 rounded-xl bg-skin-a2 flex items-center justify-center text-white disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all flex-shrink-0">
            <Send size={15} />
          </button>
        </div>
        <p className="text-center text-[10px] text-skin-muted mt-1.5">Not a substitute for medical advice</p>
      </div>
    </div>
  )
}
