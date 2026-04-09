// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react'
import { Users, CheckCircle, Clock, AlertTriangle, DollarSign } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { api, fmt, STATUS_CONFIG } from '../utils/api'
import { useToast } from '../context/ToastContext'
import { KpiCard, StatusBadge, Card } from '../components/ui'
import DataTable from '../components/DataTable'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b']

// Tooltip customizado para o gráfico de barras
const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-ink-2 border border-line rounded-md px-3 py-2 shadow-md text-sm">
      <div className="text-tx-3 text-xs mb-1">{label}</div>
      <div className="font-bold text-tx-1">{fmt.brl(payload[0]?.value || 0)}</div>
    </div>
  )
}

// Tooltip customizado para o donut
const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-ink-2 border border-line rounded-md px-3 py-2 shadow-md text-sm">
      <div className="font-bold text-tx-1">{payload[0]?.name}: {payload[0]?.value}</div>
    </div>
  )
}

export default function DashboardPage() {
  const toast = useToast()
  const [data,     setData]     = useState(null)
  const [proximas, setProximas] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard'),
      api.get('/parcelas/proximas'),
    ])
      .then(([dash, prox]) => { setData(dash); setProximas(prox) })
      .catch(err => toast(err.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="animate-fade-up space-y-5">
        <div>
          <div className="skeleton h-8 w-52 mb-2" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="grid grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-md" />)}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="skeleton h-72 rounded-md" />
          <div className="skeleton h-72 rounded-md col-span-2" />
        </div>
      </div>
    )
  }

  const kpis = data?.kpis || {}
  const mesAtual = new Date().getMonth()

  // Dados para o gráfico de barras
  const barData = (data?.receitaMensal || Array(12).fill(0)).map((val, i) => ({
    mes: MESES[i],
    receita: val,
    atual: i === mesAtual,
  }))

  // Dados para o donut
  const pieData = [
    { name: 'Pagas',     value: kpis.pagas     || 0 },
    { name: 'Atrasadas', value: kpis.atrasadas  || 0 },
    { name: 'Pendentes', value: kpis.pendentes  || 0 },
  ].filter(d => d.value > 0)

  const COLS_PROX = [
    { label: 'Cliente' },
    { label: 'Estabelecimento' },
    { label: 'Parcela', width: 80 },
    { label: 'Vencimento', width: 110 },
    { label: 'Valor', width: 120 },
    { label: 'Status', width: 140 },
  ]

  return (
    <div className="animate-fade-up space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-tx-1 tracking-tight leading-tight">
          <em className="not-italic font-bold text-brand" style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic' }}>
            Dashboard
          </em>
        </h1>
        <p className="text-sm text-tx-2 mt-1">Visão consolidada do financeiro em tempo real</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-3">
        <KpiCard label="Clientes"        value={kpis.total_clientes || 0} icon={Users}        color="blue" />
        <KpiCard label="Pagas"           value={kpis.pagas     || 0}      icon={CheckCircle}  color="green" />
        <KpiCard label="Pendentes"       value={kpis.pendentes || 0}      icon={Clock}        color="amber" />
        <KpiCard label="Atrasadas"       value={kpis.atrasadas || 0}      icon={AlertTriangle} color="red" />
        <KpiCard label="Receita Recebida" value={fmt.brl(kpis.receita_total || 0)} icon={DollarSign} color="purple" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">

        {/* Donut */}
        <Card noPad className="p-5">
          <h3 className="text-sm font-bold text-tx-1 mb-4">Status das Parcelas</h3>
          {pieData.length === 0
            ? <div className="h-52 flex items-center justify-center text-tx-3 text-sm">Sem dados</div>
            : (
              <div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legenda manual */}
                <div className="space-y-2 mt-2">
                  {pieData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                        <span className="text-tx-2">{d.name}</span>
                      </div>
                      <span className="font-bold text-tx-1">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          }
        </Card>

        {/* Bar chart */}
        <Card noPad className="p-5 col-span-2">
          <h3 className="text-sm font-bold text-tx-1 mb-4">
            Recebimentos Mensais
            <span className="text-tx-3 font-normal text-xs ml-2">{data?.ano}</span>
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#252d42" vertical={false} />
              <XAxis
                dataKey="mes"
                tick={{ fill: '#4e566e', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#4e566e', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
              />
              <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
              <Bar dataKey="receita" radius={[4, 4, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.atual ? '#3b82f6' : '#1f2433'}
                    opacity={entry.atual ? 1 : 0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Próximas parcelas */}
      <div>
        <h3 className="text-sm font-bold text-tx-1 mb-3">
          Próximas Parcelas
          <span className="text-tx-3 font-normal text-xs ml-2">— próximos 7 dias</span>
        </h3>
        <DataTable
          columns={COLS_PROX}
          loading={false}
          empty={proximas.length === 0 ? 'Nenhuma parcela nos próximos 7 dias.' : undefined}
        >
          {proximas.map(p => (
            <tr key={p.id}>
              <td className="font-semibold text-tx-1">{p.cliente_nome}</td>
              <td className="text-tx-2 text-sm">{p.estabelecimento}</td>
              <td className="text-center">
                <span className="font-bold">{p.numero_parcela}</span>
                <span className="text-tx-3 text-xs">/{p.total_parcelas}</span>
              </td>
              <td className="font-mono text-xs text-tx-2">{fmt.date(p.data_parcela)}</td>
              <td className="font-bold text-tx-1">{fmt.brl(p.valor)}</td>
              <td><StatusBadge status={p.status || 'a_pagar'} /></td>
            </tr>
          ))}
        </DataTable>
      </div>
    </div>
  )
}
