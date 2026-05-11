// src/pages/ParceirosPage.tsx
import { useState, useEffect } from 'react'
import { Landmark, Users, TrendingUp, TrendingDown, DollarSign, Handshake } from 'lucide-react'
import { api, fmt } from '../utils/api'
import { useToast } from '../context/ToastContext'
import { PageHeader, StatCard, Spinner } from '../components/ui-kit'

type Parceiro = {
  banco: string
  total_clientes: number
  total_investido: number
  total_recebido: number
  a_receber: number
}

const BANCO_THEME: Record<string, { bar: string; accent: string; border: string }> = {
  BRADESCO:  { bar: 'bg-red-500',    accent: 'text-red-400',    border: 'border-red-500/20' },
  SANTANDER: { bar: 'bg-amber-500',  accent: 'text-amber-400',  border: 'border-amber-500/20' },
  ITAU:      { bar: 'bg-blue-500',   accent: 'text-blue-400',   border: 'border-blue-500/20' },
}

function BancoCard({ dados }: { dados: Parceiro }) {
  const theme = BANCO_THEME[dados.banco] || { bar: 'bg-gold', accent: 'text-gold', border: 'border-gold/20' }
  const retorno = dados.total_investido > 0
    ? ((dados.total_recebido / dados.total_investido) * 100).toFixed(1)
    : '0.0'

  return (
    <div className={`relative rounded-xl border border-border bg-card overflow-hidden transition-all hover:-translate-y-1 shadow-card`}>
      <div className={`absolute top-0 left-0 right-0 h-1 ${theme.bar}`} />
      <div className="flex items-center gap-4 px-6 pt-7 pb-5 border-b border-border">
        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          <Landmark className="h-5 w-5 text-gold" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">{dados.banco}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Investidor Parceiro</p>
        </div>
        <div className="ml-auto text-right">
          <div className={`text-2xl font-bold ${theme.accent}`}>{retorno}%</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Retorno</div>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y divide-border">
        {[
          { icon: Users, label: 'Clientes', value: String(dados.total_clientes), color: '' },
          { icon: DollarSign, label: 'Investido', value: fmt.brl(dados.total_investido), color: '' },
          { icon: TrendingUp, label: 'Recebido', value: fmt.brl(dados.total_recebido), color: 'text-emerald-400' },
          { icon: TrendingDown, label: 'A Receber', value: fmt.brl(dados.a_receber), color: 'text-amber-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex items-center gap-3 px-5 py-4">
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <div className={`text-base font-bold leading-none ${color}`}>{value}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 py-4 border-t border-border">
        <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">
          <span>Progresso de recebimento</span>
          <span>{retorno}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-700 ${theme.bar}`}
            style={{ width: `${Math.min(parseFloat(retorno), 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default function ParceirosPage() {
  const { showToast } = useToast()
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/parceiros')
      .then(setParceiros)
      .catch((err: Error) => showToast(err.message, 'error'))
      .finally(() => setLoading(false))
  }, [showToast])

  const totais = parceiros.reduce((acc, p) => ({
    clientes:  acc.clientes  + p.total_clientes,
    investido: acc.investido + p.total_investido,
    recebido:  acc.recebido  + p.total_recebido,
    aReceber:  acc.aReceber  + p.a_receber,
  }), { clientes: 0, investido: 0, recebido: 0, aReceber: 0 })

  return (
    <>
      <PageHeader title="Parceiros" subtitle="Visão consolidada por banco investidor" />

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total clientes" value={String(totais.clientes)} icon={<Users className="h-4 w-4" />} />
          <StatCard label="Total investido" value={fmt.brl(totais.investido)} accent="gold" icon={<Handshake className="h-4 w-4" />} />
          <StatCard label="Total recebido" value={fmt.brl(totais.recebido)} accent="success" icon={<TrendingUp className="h-4 w-4" />} />
          <StatCard label="A receber" value={fmt.brl(totais.aReceber)} icon={<TrendingDown className="h-4 w-4" />} />
        </div>
      )}

      {loading ? <Spinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {parceiros.map(p => <BancoCard key={p.banco} dados={p} />)}
        </div>
      )}
    </>
  )
}
