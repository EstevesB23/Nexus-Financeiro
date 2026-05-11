// src/App.tsx
import { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import ClientesPage from './pages/ClientesPage'
import FinanceiroPage from './pages/FinanceiroPage'
import DashboardPage from './pages/DashboardPage'
import InadimplentesPage from './pages/InadimplentesPage'
import ParceirosPage from './pages/ParceirosPage'
import AprovacoesPage from './pages/AprovacoesPage'
import { Sidebar } from './components/Sidebar'
import { api } from './utils/api'
import logo from './assets/xcredit-logo.png'

const TOPBAR_TITLES: Record<string, string> = {
  clientes: 'Clientes',
  financeiro: 'Financeiro',
  dashboard: 'Dashboard',
  inadimplentes: 'Inadimplentes',
  parceiros: 'Parceiros',
  aprovacoes: 'Aprovações',
}

const ROLE_BADGE: Record<string, string> = {
  admin:         'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  cobranca:      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  inadimplencia: 'bg-red-500/10 text-red-400 border border-red-500/20',
  atendimento:   'bg-sky-500/10 text-sky-400 border border-sky-500/20',
}

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-14 h-14 rounded-xl bg-secondary border border-border flex items-center justify-center text-muted-foreground">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <div className="text-center">
        <h2 className="text-base font-bold">Acesso Restrito</h2>
        <p className="text-sm text-muted-foreground mt-1">Sem permissão para acessar esta área.</p>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-xl overflow-hidden shadow-gold">
          <img src={logo} alt="XCredit" className="h-full w-full object-cover" />
        </div>
        <div className="h-6 w-6 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
      </div>
    </div>
  )
}

export default function App() {
  const { user, role, loading } = useAuth()
  const [tab, setTab] = useState<string | null>(null)
  const [inadBadge, setInadBadge] = useState(0)
  const [aprovBadge, setAprovBadge] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!user || !role?.tabs.includes('aprovacoes')) return
    const load = () => api.get('/aprovacoes/count').then((d: { total: number }) => setAprovBadge(d.total)).catch(() => {})
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [user, role])

  if (loading) return <LoadingScreen />
  if (!user) return <LoginPage />

  const currentTab = tab || role?.tabs[0] || 'clientes'
  const isAllowed  = role?.tabs.includes(currentTab)
  const dateStr    = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      <Sidebar active={currentTab} onNavigate={setTab} inadBadge={inadBadge} aprovBadge={aprovBadge} />

      <div className="flex flex-col flex-1 overflow-hidden relative z-10">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 border-b border-border bg-card/80 backdrop-blur h-12 min-h-[48px] shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">XCredit</span>
            <span className="text-muted-foreground/50">/</span>
            <span className="font-semibold">{TOPBAR_TITLES[currentTab] || currentTab}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[11px] text-muted-foreground hidden sm:block tabular-nums">{dateStr}</span>
            {user.role && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${ROLE_BADGE[user.role] || 'bg-muted text-muted-foreground'}`}>
                {role?.label || user.role}
              </span>
            )}
            {role?.canCadastrar && (currentTab === 'clientes' || currentTab === 'financeiro') && (
              <button
                onClick={() => setRefreshKey(k => k + 1)}
                className="text-[11px] px-3 py-1 rounded-lg gradient-gold text-gold-foreground font-medium hover:opacity-90 transition"
              >
                Atualizar
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {!isAllowed
            ? <AccessDenied />
            : currentTab === 'clientes'
              ? <ClientesPage key={refreshKey} onStatsChange={() => {}} />
            : currentTab === 'financeiro'
              ? <FinanceiroPage key={refreshKey} />
            : currentTab === 'dashboard'
              ? <DashboardPage key={refreshKey} />
            : currentTab === 'inadimplentes'
              ? <InadimplentesPage key={refreshKey} onBadge={setInadBadge} />
            : currentTab === 'parceiros'
              ? <ParceirosPage key={refreshKey} />
            : currentTab === 'aprovacoes'
              ? <AprovacoesPage key={refreshKey} onBadgeChange={setAprovBadge} />
            : null
          }
        </main>
      </div>
    </div>
  )
}
