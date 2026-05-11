// src/pages/FinanceiroPage.tsx
import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, Wallet, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { api, fmt, STATUS_CONFIG } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { PageHeader, StatCard, StatusBadge, Spinner } from '../components/ui-kit'

const MESES = ['','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

type Parcela = {
  id: string
  cliente_nome: string
  estabelecimento: string
  cnpj: string
  cpf: string
  numero_parcela: number
  total_parcelas: number
  data_parcela: string
  valor: number
  status: string
}

export default function FinanceiroPage() {
  const { role } = useAuth()
  const { showToast } = useToast()

  const [parcelas, setParcelas] = useState<Parcela[]>([])
  const [anos, setAnos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const size = 15

  const [filtros, setFiltros] = useState({ mes: '', ano: '', status: '', q: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtros.mes)    params.set('mes', filtros.mes)
      if (filtros.ano)    params.set('ano', filtros.ano)
      if (filtros.status) params.set('status', filtros.status)
      if (filtros.q)      params.set('q', filtros.q)
      const data = await api.get(`/parcelas?${params}`)
      setParcelas(data)
      setPage(1)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao carregar', 'error')
    } finally {
      setLoading(false)
    }
  }, [filtros, showToast])

  useEffect(() => { load() }, [load])
  useEffect(() => { api.get('/parcelas/anos').then(setAnos).catch(() => {}) }, [])

  const setF = (key: string, value: string) => setFiltros(prev => ({ ...prev, [key]: value }))

  const handleStatusChange = async (id: string, novoStatus: string) => {
    try {
      await api.patch(`/parcelas/${id}/status`, { status: novoStatus })
      showToast('Status atualizado!', 'success')
      load()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro', 'error')
    }
  }

  const total    = parcelas.reduce((s, p) => s + p.valor, 0)
  const pagas    = parcelas.filter(p => ['pago','pagamento_dia'].includes(p.status)).reduce((s, p) => s + p.valor, 0)
  const pendentes = parcelas.filter(p => p.status === 'a_pagar').reduce((s, p) => s + p.valor, 0)
  const atrasadas = parcelas.filter(p => ['atrasado','inadimplente','protestado'].includes(p.status)).reduce((s, p) => s + p.valor, 0)

  const paged = parcelas.slice((page - 1) * size, page * size)
  const totalPages = Math.ceil(parcelas.length / size)

  return (
    <>
      <PageHeader title="Financeiro" subtitle="Acompanhe e gerencie todas as parcelas" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total" value={fmt.brl(total)} accent="gold" icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Pagas" value={fmt.brl(pagas)} accent="success" icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="A Pagar" value={fmt.brl(pendentes)} icon={<Clock className="h-4 w-4" />} />
        <StatCard label="Atrasadas" value={fmt.brl(atrasadas)} accent="danger" icon={<AlertTriangle className="h-4 w-4" />} />
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card">
        {/* Filters */}
        <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={filtros.q}
              onChange={e => setF('q', e.target.value)}
              placeholder="Buscar cliente..."
              className="w-52 rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select value={filtros.mes} onChange={e => setF('mes', e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gold transition">
              <option value="">Todos os meses</option>
              {MESES.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <select value={filtros.ano} onChange={e => setF('ano', e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gold transition">
              <option value="">Todos os anos</option>
              {anos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={filtros.status} onChange={e => setF('status', e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gold transition">
              <option value="">Todos os status</option>
              {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                <option key={val} value={val}>{cfg.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/30">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Estabelecimento</th>
                  <th className="px-4 py-3 font-medium">Parcela</th>
                  <th className="px-4 py-3 font-medium">Vencimento</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {role?.canStatus && <th className="px-4 py-3 font-medium">Alterar</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paged.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nenhuma parcela encontrada.</td></tr>
                ) : paged.map(p => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{p.cliente_nome}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{p.estabelecimento || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold">{p.numero_parcela}</span>
                      <span className="text-muted-foreground text-xs">/{p.total_parcelas}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{fmt.date(p.data_parcela)}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-gold">{fmt.brl(p.valor)}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status || 'a_pagar'} /></td>
                    {role?.canStatus && (
                      <td className="px-4 py-3">
                        <select
                          value={p.status || 'a_pagar'}
                          onChange={e => handleStatusChange(p.id, e.target.value)}
                          className="rounded-lg border border-input bg-background px-2 py-1 text-xs outline-none focus:border-gold transition"
                        >
                          {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                            <option key={val} value={val}>{cfg.label}</option>
                          ))}
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm">
            <span className="text-muted-foreground">{parcelas.length} parcelas · pág. {page}/{totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted disabled:opacity-40 transition">Anterior</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted disabled:opacity-40 transition">Próxima</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
