// src/pages/DashboardPage.tsx
import { useState, useEffect } from 'react'
import { Users, CheckCircle, Clock, AlertTriangle, DollarSign, Wallet, CalendarClock, Filter, X } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { api, fmt } from '../utils/api'
import { useToast } from '../context/ToastContext'
import { PageHeader, StatCard, StatusBadge, Spinner } from '../components/ui-kit'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b']

function buildQS(obj: Record<string, string | number>) {
  const p = new URLSearchParams()
  Object.entries(obj).forEach(([k, v]) => { if (v !== '' && v != null) p.set(k, String(v)) })
  const s = p.toString()
  return s ? `?${s}` : ''
}

type KPIs = {
  total_clientes: number; pagas: number; pendentes: number; atrasadas: number
  receita_total: number; a_receber: number
}

type DashData = {
  kpis: KPIs
  receitaMensal: number[]
  anos: string[]
  bancos: string[]
  consultores: string[]
}

type ProximaParcela = {
  id: string; cliente_nome: string; data_parcela: string; valor: number; status: string
}

export default function DashboardPage() {
  const { showToast } = useToast()
  const [data, setData] = useState<DashData | null>(null)
  const [proximas, setProximas] = useState<ProximaParcela[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ ano: '', banco: '' })
  const [diasProx, setDiasProx] = useState(7)

  useEffect(() => {
    const proxQS = buildQS({ ...filters, dias: diasProx })
    const dashQS = buildQS(filters)
    setLoading(true)
    Promise.all([
      api.get(`/dashboard${dashQS}`),
      api.get(`/parcelas/proximas${proxQS}`),
    ])
      .then(([dash, prox]) => { setData(dash); setProximas(prox) })
      .catch(err => showToast(err instanceof Error ? err.message : 'Erro', 'error'))
      .finally(() => setLoading(false))
  }, [filters, diasProx, showToast])

  const setFilter = (key: string, val: string) => setFilters(f => ({ ...f, [key]: val }))
  const hasFilters = filters.ano || filters.banco

  const kpis = data?.kpis || {} as KPIs
  const totalParcelas = (kpis.pagas || 0) + (kpis.atrasadas || 0) + (kpis.pendentes || 0)
  const taxaInad = totalParcelas > 0 ? ((kpis.atrasadas || 0) / totalParcelas * 100).toFixed(1) : '0.0'

  const areaData = (data?.receitaMensal || Array(12).fill(0)).map((val, i) => ({
    mes: MESES[i], receita: val,
  }))

  const pieData = [
    { name: 'Pagas',     value: kpis.pagas    || 0 },
    { name: 'Atrasadas', value: kpis.atrasadas || 0 },
    { name: 'Pendentes', value: kpis.pendentes || 0 },
  ].filter(d => d.value > 0)

  const receitaTotal = (data?.receitaMensal || []).reduce((a: number, b: number) => a + b, 0)

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Visão consolidada da operação financeira"
        actions={
          <div className="flex items-center gap-2">
            {(['ano', 'banco'] as const).map(key => (
              <select key={key} value={filters[key]} onChange={e => setFilter(key, e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gold transition capitalize">
                <option value="">{key.charAt(0).toUpperCase() + key.slice(1)}</option>
                {(data?.[`${key}s` as 'anos' | 'bancos'] || []).map((v: string) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            ))}
            {hasFilters && (
              <button onClick={() => setFilters({ ano: '', banco: '' })}
                className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard label="Clientes"      value={String(kpis.total_clientes || 0)} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Pagas"         value={String(kpis.pagas || 0)}          accent="success" icon={<CheckCircle className="h-4 w-4" />} />
        <StatCard label="Pendentes"     value={String(kpis.pendentes || 0)}      icon={<Clock className="h-4 w-4" />} />
        <StatCard label="Atrasadas"     value={String(kpis.atrasadas || 0)}      accent="danger" icon={<AlertTriangle className="h-4 w-4" />} />
        <StatCard label="Receita Total" value={fmt.brl(kpis.receita_total || 0)} accent="gold" icon={<DollarSign className="h-4 w-4" />} />
        <StatCard label="A Receber"     value={fmt.brl(kpis.a_receber || 0)}     icon={<Wallet className="h-4 w-4" />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Pie */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold tracking-tight">Status das parcelas</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Distribuição da carteira</p>
            </div>
            {totalParcelas > 0 && (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                parseFloat(taxaInad) > 20 ? 'bg-red-500/10 text-red-400' :
                parseFloat(taxaInad) > 8 ? 'bg-amber-500/10 text-amber-400' :
                'bg-emerald-500/10 text-emerald-400'}`}>
                {taxaInad}% inad.
              </span>
            )}
          </div>

          {pieData.length === 0
            ? (loading ? <Spinner /> : <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>)
            : (
              <>
                <div className="h-52 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={58} outerRadius={88} paddingAngle={3} dataKey="value" stroke="none">
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [v, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{totalParcelas}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  {pieData.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i] }} />
                      <span className="flex-1 text-muted-foreground">{d.name}</span>
                      <span className="font-bold tabular-nums">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )
          }
        </div>

        {/* Area chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold tracking-tight">Recebimentos mensais</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total recebido: <span className="text-foreground font-bold tabular-nums">{fmt.brl(receitaTotal)}</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-gold" /> Receita
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(43 80% 65%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(43 80% 65%)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
                <Tooltip formatter={(v: number) => [fmt.brl(v), 'Receita']} />
                <Area type="monotone" dataKey="receita" name="Receita" stroke="hsl(43 80% 65%)" strokeWidth={2} fill="url(#gReceita)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Próximas parcelas */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center">
              <CalendarClock className="h-5 w-5 text-gold-foreground" />
            </div>
            <div>
              <h3 className="font-semibold tracking-tight">Próximas parcelas</h3>
              <p className="text-xs text-muted-foreground">{proximas.length} parcela{proximas.length !== 1 ? 's' : ''} nos próximos {diasProx} dias</p>
            </div>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border">
            <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1.5" />
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => setDiasProx(d)}
                className={`px-3 h-8 rounded-lg text-xs font-semibold transition-all ${
                  diasProx === d ? 'gradient-gold text-gold-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >{d}d</button>
            ))}
          </div>
        </div>

        {loading ? <Spinner /> : proximas.length === 0
          ? <div className="py-12 text-center text-muted-foreground text-sm">Nenhuma parcela nos próximos {diasProx} dias.</div>
          : (
            <ul className="divide-y divide-border">
              {proximas.map(p => (
                <li key={p.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                  <div className="h-9 w-9 rounded-full gradient-gold flex items-center justify-center text-xs font-bold text-gold-foreground shrink-0">
                    {p.cliente_nome[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{p.cliente_nome}</p>
                    <p className="text-xs text-muted-foreground">Vence em {fmt.date(p.data_parcela)}</p>
                  </div>
                  <StatusBadge status={p.status} />
                  <span className="font-bold tabular-nums text-sm text-gold w-28 text-right">{fmt.brl(p.valor)}</span>
                </li>
              ))}
            </ul>
          )
        }
      </div>
    </>
  )
}
