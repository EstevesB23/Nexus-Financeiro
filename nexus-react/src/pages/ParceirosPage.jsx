// src/pages/ParceirosPage.jsx
import { useState, useEffect } from 'react'
import { Landmark, Users, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { api, fmt } from '../utils/api'
import { useToast } from '../context/ToastContext'

const BANCO_THEME = {
  BRADESCO: {
    color:   'danger',
    bar:     'bg-danger',
    icon:    'bg-danger/15 text-danger',
    glow:    'shadow-[0_0_24px_rgba(239,68,68,0.12)]',
    border:  'border-danger/20',
    accent:  'text-danger',
  },
  SANTANDER: {
    color:   'warn',
    bar:     'bg-warn',
    icon:    'bg-warn/15 text-warn',
    glow:    'shadow-[0_0_24px_rgba(245,158,11,0.12)]',
    border:  'border-warn/20',
    accent:  'text-warn',
  },
  ITAU: {
    color:   'blue',
    bar:     'bg-brand',
    icon:    'bg-brand/15 text-brand',
    glow:    'shadow-[0_0_24px_rgba(59,130,246,0.12)]',
    border:  'border-brand/20',
    accent:  'text-brand',
  },
}

function BancoCard({ dados }) {
  const theme = BANCO_THEME[dados.banco] || BANCO_THEME.ITAU
  const retorno = dados.total_investido > 0
    ? ((dados.total_recebido / dados.total_investido) * 100).toFixed(1)
    : '0.0'

  return (
    <div className={`relative bg-ink-2 border border-line rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${theme.glow}`}>
      {/* Barra colorida no topo */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${theme.bar}`} />

      {/* Header do card */}
      <div className="flex items-center gap-4 px-6 pt-7 pb-5 border-b border-line/60">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${theme.icon}`}>
          <Landmark size={22} />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-tx-1 tracking-tight">{dados.banco}</h2>
          <p className="text-xs text-tx-3 font-semibold mt-0.5">Investidor Parceiro</p>
        </div>
        <div className="ml-auto text-right">
          <div className={`text-2xl font-extrabold ${theme.accent}`}>{retorno}%</div>
          <div className="text-[0.65rem] text-tx-3 uppercase tracking-wide font-semibold">Retorno</div>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-line/60">
        <Metric icon={Users} label="Clientes" value={dados.total_clientes} text />
        <Metric icon={DollarSign} label="Total Investido" value={fmt.brl(dados.total_investido)} />
        <Metric icon={TrendingUp} label="Total Recebido" value={fmt.brl(dados.total_recebido)} green />
        <Metric icon={TrendingDown} label="A Receber" value={fmt.brl(dados.a_receber)} amber />
      </div>

      {/* Barra de progresso */}
      <div className="px-6 py-4 border-t border-line/60">
        <div className="flex justify-between text-[0.68rem] text-tx-3 font-semibold mb-1.5 uppercase tracking-wide">
          <span>Progresso de recebimento</span>
          <span>{retorno}%</span>
        </div>
        <div className="h-2 bg-ink-4 rounded-full overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-700 ${theme.bar}`}
            style={{ width: `${Math.min(parseFloat(retorno), 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value, text, green, amber }) {
  const color = green ? 'text-success' : amber ? 'text-warn' : 'text-tx-1'
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <Icon size={16} className="text-tx-3 flex-shrink-0" />
      <div>
        <div className={`text-base font-extrabold leading-none ${color}`}>{value}</div>
        <div className="text-[0.65rem] text-tx-3 uppercase tracking-wide font-semibold mt-1">{label}</div>
      </div>
    </div>
  )
}

export default function ParceirosPage() {
  const toast = useToast()
  const [parceiros, setParceiros] = useState([])
  const [loading, setLoading]     = useState(true)
  const [filtro, setFiltro]       = useState('')

  useEffect(() => {
    api.get('/parceiros')
      .then(setParceiros)
      .catch(err => toast(err.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  const visíveis = filtro ? parceiros.filter(p => p.banco === filtro) : parceiros

  const totais = visíveis.reduce((acc, p) => ({
    clientes:  acc.clientes  + p.total_clientes,
    investido: acc.investido + p.total_investido,
    recebido:  acc.recebido  + p.total_recebido,
    aReceber:  acc.aReceber  + p.a_receber,
  }), { clientes: 0, investido: 0, recebido: 0, aReceber: 0 })

  return (
    <div className="animate-fade-up space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-tx-1 tracking-tight leading-tight">
            Parceiros{' '}
            <em className="not-italic font-bold text-brand" style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic' }}>
              Investidores
            </em>
          </h1>
          <p className="text-sm text-tx-2 mt-1">Visão consolidada por banco investidor</p>
        </div>

        {/* Totais */}
        {!loading && (
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-2xl font-extrabold text-tx-1 leading-none">{totais.clientes}</div>
              <div className="text-[0.65rem] uppercase tracking-wide text-tx-3 font-semibold mt-1">Clientes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold text-success leading-none">{fmt.brl(totais.recebido)}</div>
              <div className="text-[0.65rem] uppercase tracking-wide text-tx-3 font-semibold mt-1">Recebido</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold text-warn leading-none">{fmt.brl(totais.aReceber)}</div>
              <div className="text-[0.65rem] uppercase tracking-wide text-tx-3 font-semibold mt-1">A Receber</div>
            </div>
          </div>
        )}
      </div>

      {/* Filtro */}
      <div className="flex items-center gap-2">
        <select
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          className="sel text-sm py-2"
        >
          <option value="">Todos os bancos</option>
          {parceiros.map(p => (
            <option key={p.banco} value={p.banco}>{p.banco}</option>
          ))}
        </select>
        {filtro && (
          <button
            onClick={() => setFiltro('')}
            className="text-xs text-tx-3 hover:text-tx-1 transition-colors"
          >
            Limpar filtro
          </button>
        )}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-ink-2 border border-line rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {visíveis.map(p => <BancoCard key={p.banco} dados={p} />)}
        </div>
      )}
    </div>
  )
}
