// src/components/Sidebar.jsx
import { Users, CreditCard, BarChart2, AlertTriangle, LogOut, Landmark } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { id: 'clientes',      label: 'Clientes',      Icon: Users },
  { id: 'financeiro',    label: 'Financeiro',     Icon: CreditCard },
  { id: 'dashboard',     label: 'Dashboard',      Icon: BarChart2 },
  { id: 'inadimplentes', label: 'Inadimplentes',  Icon: AlertTriangle, alert: true },
  { id: 'parceiros',     label: 'Parceiros',      Icon: Landmark },
]

const ROLE_COLORS = {
  admin:         'from-brand to-purple',
  cobranca:      'from-success to-teal',
  inadimplencia: 'from-danger to-pink',
  atendimento:   'from-warn to-orange-500',
}

export default function Sidebar({ active, onNavigate, inadBadge }) {
  const { user, role, logout } = useAuth()
  const initials = user?.nome?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'

  return (
    <aside className="w-60 min-w-60 flex flex-col bg-ink-2 border-r border-line relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 140% 60% at 50% -10%, rgba(59,130,246,0.07) 0%, transparent 70%), radial-gradient(ellipse 80% 40% at 50% 110%, rgba(167,139,250,0.05) 0%, transparent 70%)',
        }}
      />

      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-line/60 relative">
        <div className="w-9 h-9 rounded-sm bg-brand flex items-center justify-center flex-shrink-0 shadow-glow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" className="text-white"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <div className="text-base font-extrabold text-tx-1 tracking-tight leading-none">Xcredit</div>
          <div className="text-[0.65rem] text-tx-3 font-semibold uppercase tracking-widest mt-0.5">Financeiro</div>
        </div>
      </div>

      {/* Section label */}
      <div className="px-5 pt-5 pb-2 text-[0.62rem] font-bold tracking-[1px] uppercase text-tx-4">
        Menu
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-3 flex-1 relative">
        {NAV.map(({ id, label, Icon, alert }) => {
          const allowed = role?.tabs.includes(id)
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-sm font-medium w-full text-left transition-all duration-150
                ${isActive
                  ? 'bg-brand/15 text-brand font-semibold shadow-[inset_0_0_0_1px_rgba(59,130,246,0.2)]'
                  : allowed
                    ? 'text-tx-2 hover:bg-ink-3 hover:text-tx-1'
                    : 'text-tx-4 cursor-not-allowed opacity-50'
                }`}
              disabled={!allowed}
            >
              <Icon size={15} className={isActive ? 'text-brand' : ''} />
              <span className="flex-1">{label}</span>
              {alert && inadBadge > 0 && (
                <span className="w-5 h-5 rounded-full bg-danger text-white text-[0.6rem] font-extrabold flex items-center justify-center">
                  !
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-line/60 relative space-y-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-sm bg-gradient-to-br ${ROLE_COLORS[user?.role] || 'from-brand to-purple'} flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0`}>
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-tx-1 truncate">{user?.nome}</div>
            <div className="text-[0.65rem] text-tx-3">{role?.label}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-sm text-sm font-semibold text-tx-2 bg-ink-3 border border-line hover:bg-danger/15 hover:text-danger hover:border-danger/30 transition-all"
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </aside>
  )
}
