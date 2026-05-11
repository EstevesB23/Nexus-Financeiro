// src/pages/InadimplentesPage.tsx
import { useState, useEffect, useCallback } from 'react'
import { Users, CreditCard, DollarSign, Search, Phone, AlertTriangle, MessageSquare, X, Save } from 'lucide-react'
import { api, fmt, STATUS_CONFIG } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { PageHeader, StatCard, StatusBadge, Spinner } from '../components/ui-kit'

type Parcela = {
  id: string
  cliente_nome: string
  estabelecimento: string
  telefone: string
  banco: string
  numero_parcela: number
  total_parcelas: number
  data_parcela: string
  valor: number
  status: string
  dias_atraso: number
  qtd_atrasadas: number
  observacao: string | null
}

type NotesModal = {
  open: boolean
  parcelaId: string
  clienteNome: string
  parcela: string
  text: string
}

type Props = { onBadge?: (n: number) => void }

export default function InadimplentesPage({ onBadge }: Props) {
  const { role } = useAuth()
  const { showToast } = useToast()

  const [inad, setInad] = useState<Parcela[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('todos')
  const [page, setPage] = useState(1)
  const size = 15

  const [notes, setNotes] = useState<NotesModal>({ open: false, parcelaId: '', clienteNome: '', parcela: '', text: '' })
  const [savingNotes, setSavingNotes] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get('/parcelas?inadimplente=1')
      setInad(data)
      onBadge?.(data.length)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro', 'error')
    } finally {
      setLoading(false)
    }
  }, [onBadge, showToast])

  useEffect(() => { load() }, [load])

  const handleStatusChange = async (id: string, novoStatus: string) => {
    try {
      await api.patch(`/parcelas/${id}/status`, { status: novoStatus })
      showToast('Status atualizado!', 'success')
      load()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro', 'error')
    }
  }

  const openNotes = (p: Parcela) => {
    setNotes({
      open: true,
      parcelaId: p.id,
      clienteNome: p.cliente_nome,
      parcela: `${p.numero_parcela}/${p.total_parcelas}`,
      text: p.observacao ?? '',
    })
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      await api.patch(`/parcelas/${notes.parcelaId}/observacao`, { observacao: notes.text })
      setInad(prev => prev.map(p => p.id === notes.parcelaId ? { ...p, observacao: notes.text || null } : p))
      showToast('Nota salva!', 'success')
      setNotes(n => ({ ...n, open: false }))
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro', 'error')
    } finally {
      setSavingNotes(false)
    }
  }

  const TABS = [
    { key: 'todos',        label: 'Todos' },
    { key: 'atrasado',     label: 'Atrasados' },
    { key: 'inadimplente', label: 'Inadimplentes' },
    { key: 'protestado',   label: 'Protestados' },
  ]

  const filtered = inad.filter(p => {
    const matchSearch = !search ||
      p.cliente_nome?.toLowerCase().includes(search.toLowerCase()) ||
      p.estabelecimento?.toLowerCase().includes(search.toLowerCase()) ||
      p.telefone?.includes(search)
    const matchTab = tab === 'todos' || p.status === tab
    return matchSearch && matchTab
  })

  const totalAtraso = filtered.reduce((s, p) => s + p.valor, 0)
  const maxAtraso = filtered.reduce((max, p) => Math.max(max, p.dias_atraso || 0), 0)
  const criticos = filtered.filter(p => (p.dias_atraso || 0) > 30).length

  const paged = filtered.slice((page - 1) * size, page * size)
  const totalPages = Math.ceil(filtered.length / size)

  return (
    <>
      <PageHeader title="Inadimplentes" subtitle="Parcelas em atraso e clientes inadimplentes" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total em atraso" value={String(inad.length)} accent="danger" icon={<Users className="h-4 w-4" />} />
        <StatCard label="Valor em atraso" value={fmt.brl(totalAtraso)} accent="danger" icon={<DollarSign className="h-4 w-4" />} />
        <StatCard label="Críticos (+30d)" value={String(criticos)} accent="danger" icon={<AlertTriangle className="h-4 w-4" />} />
        <StatCard label="Maior atraso" value={`${maxAtraso}d`} icon={<CreditCard className="h-4 w-4" />} />
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card">
        {/* Filters */}
        <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Buscar cliente, estabelecimento..."
              className="w-56 rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition"
            />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border ml-auto">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setPage(1) }}
                className={`px-3 h-8 rounded-lg text-xs font-semibold transition-all ${
                  tab === t.key ? 'gradient-gold text-gold-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >{t.label}</button>
            ))}
          </div>
        </div>

        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/30">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Contato</th>
                  <th className="px-4 py-3 font-medium">Banco</th>
                  <th className="px-4 py-3 font-medium">Parcela</th>
                  <th className="px-4 py-3 font-medium">Vencimento</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Atraso</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Notas</th>
                  {role?.canStatus && <th className="px-4 py-3 font-medium">Alterar</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paged.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Nenhuma parcela encontrada.</td></tr>
                ) : paged.map(p => {
                  const diasAtraso = p.dias_atraso || 0
                  const atrasoColor = diasAtraso > 30 ? 'text-red-400' : diasAtraso > 14 ? 'text-amber-400' : 'text-muted-foreground'
                  const hasNote = !!p.observacao?.trim()
                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-gold shrink-0">
                            {p.cliente_nome?.[0] || '?'}
                          </div>
                          <div>
                            <div className="font-medium">{p.cliente_nome}</div>
                            {p.estabelecimento && <div className="text-xs text-muted-foreground">{p.estabelecimento}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {p.telefone ? (
                          <a href={`tel:${p.telefone}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold transition-colors">
                            <Phone className="h-3 w-3" />{p.telefone}
                          </a>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{p.banco || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold">{p.numero_parcela}</span>
                        <span className="text-muted-foreground text-xs">/{p.total_parcelas}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{fmt.date(p.data_parcela)}</td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-red-400">{fmt.brl(p.valor)}</td>
                      <td className={`px-4 py-3 font-bold tabular-nums ${atrasoColor}`}>
                        {diasAtraso > 0 ? `${diasAtraso}d` : '—'}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3">
                        {role?.canNotes ? (
                          <button
                            onClick={() => openNotes(p)}
                            title={hasNote ? p.observacao! : 'Adicionar nota'}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors ${
                              hasNote
                                ? 'text-gold bg-gold/10 hover:bg-gold/20'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            {hasNote ? 'Ver nota' : 'Adicionar'}
                          </button>
                        ) : (
                          hasNote
                            ? <span className="text-xs text-muted-foreground italic line-clamp-1 max-w-[140px]">{p.observacao}</span>
                            : <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      {role?.canStatus && (
                        <td className="px-4 py-3">
                          <select
                            value={p.status}
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
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm">
            <span className="text-muted-foreground">{filtered.length} parcelas · pág. {page}/{totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted disabled:opacity-40 transition">Anterior</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted disabled:opacity-40 transition">Próxima</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Notas */}
      {notes.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h3 className="font-semibold text-sm">Notas de acompanhamento</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {notes.clienteNome} · Parcela {notes.parcela}
                </p>
              </div>
              <button
                onClick={() => setNotes(n => ({ ...n, open: false }))}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <textarea
                value={notes.text}
                onChange={e => setNotes(n => ({ ...n, text: e.target.value }))}
                placeholder="Registre aqui as tentativas de contato, acordos, combinados..."
                rows={6}
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition resize-none"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setNotes(n => ({ ...n, open: false }))}
                  className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-gold text-gold-foreground text-sm font-semibold disabled:opacity-60 transition-opacity"
                >
                  <Save className="h-3.5 w-3.5" />
                  {savingNotes ? 'Salvando...' : 'Salvar nota'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
