// src/components/Layout.jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { Scan, Clock, MessageCircle, LogOut, Sparkles } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const NAV = [
  { to: '/dashboard', icon: Scan,          label: 'Scan'    },
  { to: '/routine',   icon: Clock,         label: 'Routine' },
  { to: '/history',   icon: Clock,         label: 'History' },
  { to: '/chat',      icon: MessageCircle, label: 'Chat'    },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="app-screen flex flex-col bg-skin-bg relative w-full">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-skin-bg/95 backdrop-blur-md border-b border-skin-border px-4 sm:px-5 py-3.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-skin-a2 flex items-center justify-center shadow-sm">
            <Sparkles size={15} className="text-white" />
          </div>
          <div className="min-w-0">
            <span className="font-display font-bold text-sm sm:text-base text-skin-text tracking-wide">SKINSIGHT</span>
            <span className="ml-1.5 sm:ml-2 text-[10px] font-semibold uppercase tracking-widest text-skin-a2 bg-skin-a1 bg-opacity-40 px-1.5 py-0.5 rounded-full">LIVE</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="text-right min-w-0">
            <p className="text-[10px] text-skin-muted leading-none">signed in as</p>
            <p className="text-xs sm:text-sm font-semibold text-skin-text leading-tight truncate max-w-[80px] sm:max-w-[100px]">{user?.name?.split(' ')[0]}</p>
          </div>
          <button onClick={() => { logout(); navigate('/') }}
            className="w-8 h-8 rounded-xl bg-skin-card border border-skin-border flex items-center justify-center hover:bg-skin-a1 hover:bg-opacity-40 transition-colors"
            title="Sign out">
            <LogOut size={14} className="text-skin-muted" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-[calc(5.5rem+env(safe-area-inset-bottom))]">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-t border-skin-border px-2.5 sm:px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <div className="flex justify-around items-center gap-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `flex-1 min-w-0 flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-2xl transition-all duration-200 ${isActive ? 'text-skin-a2' : 'text-skin-muted'}`
            }>
              {({ isActive }) => (<>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-skin-a1 bg-opacity-35' : ''}`}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className="text-[10px] sm:text-[11px] font-medium truncate">{label}</span>
              </>)}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
