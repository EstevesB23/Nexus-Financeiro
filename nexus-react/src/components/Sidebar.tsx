// src/components/Sidebar.tsx
import { LayoutDashboard, Users, Wallet, AlertTriangle, Handshake, LogOut, ClipboardCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/xcredit-logo.png'

const ALL_ITEMS = [
  { id: 'dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'clientes',      label: 'Clientes',       icon: Users },
  { id: 'financeiro',    label: 'Financeiro',     icon: Wallet },
  { id: 'inadimplentes', label: 'Inadimplentes',  icon: AlertTriangle },
  { id: 'parceiros',     label: 'Parceiros',      icon: Handshake },
  { id: 'aprovacoes',    label: 'Aprovações',     icon: ClipboardCheck },
]

type Props = {
  active: string
  onNavigate: (tab: string) => void
  inadBadge?: number
  aprovBadge?: number
}

export function Sidebar({ active, onNavigate, inadBadge = 0, aprovBadge = 0 }: Props) {
  const { user, role, logout } = useAuth()

  const items = ALL_ITEMS.filter(item => role?.tabs.includes(item.id))

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="h-11 w-11 rounded-lg overflow-hidden ring-1 ring-yellow-400/30 shadow-[var(--shadow-gold)]">
          <img src={logo} alt="XCredit Financeira" className="h-full w-full object-cover" />
        </div>
        <div className="leading-tight">
          <div className="font-semibold tracking-tight text-sidebar-foreground">X-Credit</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Soluções Financeiras</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {items.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={[
                'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all text-left',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground border shadow-card'
                  : 'text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent/60',
              ].join(' ')}
              style={{ borderColor: isActive ? 'hsl(var(--border))' : 'transparent' }}
            >
              <Icon className={['h-4 w-4', isActive ? 'text-gold' : ''].join(' ')} />
              <span>{label}</span>
              {id === 'inadimplentes' && inadBadge > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                  {inadBadge}
                </span>
              )}
              {id === 'aprovacoes' && aprovBadge > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-amber-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                  {aprovBadge}
                </span>
              )}
              {isActive && id !== 'inadimplentes' && id !== 'aprovacoes' && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />
              )}
            </button>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="border-t p-3" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/40 px-3 py-2.5">
          <div className="h-8 w-8 rounded-full gradient-gold flex items-center justify-center text-xs font-bold text-gold-foreground shrink-0">
            {user?.nome?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate text-sidebar-foreground">{user?.nome}</div>
            <div className="text-xs text-muted-foreground truncate">{role?.label}</div>
          </div>
          <button
            onClick={logout}
            className="text-muted-foreground hover:text-gold transition-colors"
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
