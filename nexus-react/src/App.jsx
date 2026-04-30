// src/App.jsx
import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import LoginPage        from './pages/LoginPage'
import ClientesPage     from './pages/ClientesPage'
import FinanceiroPage   from './pages/FinanceiroPage'
import DashboardPage    from './pages/DashboardPage'
import InadimplentesPage from './pages/InadimplentesPage'
import ParceirosPage     from './pages/ParceirosPage'
import Sidebar          from './components/Sidebar'
import { Button }       from './components/ui'
import { Plus }         from 'lucide-react'
import ClienteModal     from './components/ClienteModal'

const TOPBAR_TITLES = {
  clientes:      'Clientes',
  financeiro:    'Financeiro',
  dashboard:     'Dashboard',
  inadimplentes: 'Inadimplentes',
  parceiros:     'Parceiros',
}

// Tela de acesso negado
function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-up">
      <div className="w-20 h-20 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center text-danger">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <h2 className="text-xl font-extrabold text-tx-1">Acesso Restrito</h2>
      <p className="text-sm text-tx-2 text-center max-w-xs">
        Você não tem permissão para acessar esta área.<br />
        Entre em contato com um administrador.
      </p>
    </div>
  )
}

export default function App() {
  const { user, role, loading } = useAuth()
  const [tab,      setTab]      = useState(null)
  const [inadBadge, setInadBadge] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Loading inicial (restaurando sessão)
  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-brand flex items-center justify-center animate-pulse">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-tx-3 text-sm">Carregando…</p>
        </div>
      </div>
    )
  }

  if (!user) return <LoginPage />

  // Define aba inicial
  const currentTab = tab || role?.tabs[0] || 'clientes'
  const isAllowed  = role?.tabs.includes(currentTab)

  // Data atual formatada
  const dateStr = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).replace(',', '')

  const roleBadgeColors = {
    admin:         'bg-brand/15 text-brand border-brand/25',
    cobranca:      'bg-success/15 text-success border-success/25',
    inadimplencia: 'bg-danger/15 text-danger border-danger/25',
    atendimento:   'bg-warn/15 text-warn border-warn/25',
  }

  const showNewClientBtn = role?.canCadastrar && (currentTab === 'clientes' || currentTab === 'financeiro')

  return (
    <div className="flex h-screen overflow-hidden bg-ink">
      {/* Sidebar */}
      <Sidebar
        active={currentTab}
        onNavigate={setTab}
        inadBadge={inadBadge}
      />

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Topbar */}
        <header className="flex items-center justify-between px-7 border-b border-line bg-ink-2 h-15 min-h-[60px]">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-tx-3 font-medium">Xcredit</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2e3448" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <span className="font-bold text-tx-1">{TOPBAR_TITLES[currentTab] || currentTab}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-tx-3 font-medium hidden sm:block">{dateStr}</span>

            {/* Role badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${roleBadgeColors[user.role] || ''}`}>
              {role?.label}
            </span>

            {/* Novo cliente button */}
            {showNewClientBtn && (
              <Button onClick={() => setModalOpen(true)} size="sm">
                <Plus size={13} />
                Novo Cliente
              </Button>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-7">
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
            : null
          }
        </main>
      </div>

      {/* Global "Novo Cliente" modal (para quando aberto pelo topbar) */}
      <ClienteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        cliente={null}
        onSaved={() => setRefreshKey(k => k + 1)}
      />
    </div>
  )
}
