// src/pages/ClientesPage.tsx
import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Eye, Trash2 } from 'lucide-react'
import { api, fmt } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { PageHeader, Spinner } from '../components/ui-kit'
import ClienteModal from '../components/ClienteModal'

const BANCO_DOT: Record<string, string> = {
  BRADESCO: 'bg-red-500',
  SANTANDER: 'bg-amber-500',
  ITAU: 'bg-blue-400',
}

type Cliente = {
  id: string; nome: string; estabelecimento: string; cpf: string; cnpj: string
  telefone: string; banco: string; consultor: string; data_contrato: string
  qtd_parcelas: number; valor_parcela: number; cep: string; referencias: string
}

type Props = { onStatsChange?: (n: number) => void }

export default function ClientesPage({ onStatsChange }: Props) {
  const { role } = useAuth()
  const { showToast } = useToast()

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const size = 15

  const [editModal, setEditModal] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [detailCliente, setDetailCliente] = useState<Cliente | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get(`/clientes${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      setClientes(data)
      onStatsChange?.(data.length)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro', 'error')
    } finally {
      setLoading(false)
    }
  }, [q, onStatsChange, showToast])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [q])

  const handleDelete = async (c: Cliente) => {
    if (!window.confirm(`Excluir "${c.nome}" e todas as suas parcelas?`)) return
    try {
      await api.delete(`/clientes/${c.id}`)
      showToast('Cliente excluído.', 'info')
      load()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro', 'error')
    }
  }

  const paged = clientes.slice((page - 1) * size, page * size)
  const totalPages = Math.ceil(clientes.length / size)
  const mesAtual = new Date().getMonth() + 1
  const anoAtual = new Date().getFullYear()
  const novos = clientes.filter(c => {
    if (!c.data_contrato) return false
    const [y, m] = c.data_contrato.split('-')
    return parseInt(m) === mesAtual && parseInt(y) === anoAtual
  }).length

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle="Cadastre e gerencie sua base de clientes"
        actions={role?.canCadastrar ? (
          <button
            onClick={() => { setEditing(null); setEditModal(true) }}
            className="inline-flex items-center gap-2 rounded-lg gradient-gold text-gold-foreground font-medium px-4 py-2 text-sm hover:opacity-95 transition shadow-gold"
          >
            <Plus className="h-4 w-4" /> Novo Cliente
          </button>
        ) : undefined}
      />

      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Buscar nome, CNPJ, CPF, estabelecimento..."
              className="w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition"
            />
          </div>
          <div className="ml-auto flex gap-6 text-center">
            <div>
              <div className="text-2xl font-bold tabular-nums">{clientes.length}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums text-emerald-400">{novos}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Este mês</div>
            </div>
          </div>
        </div>

        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/30">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Estabelecimento</th>
                  <th className="px-4 py-3 font-medium">Documento</th>
                  <th className="px-4 py-3 font-medium">Telefone</th>
                  <th className="px-4 py-3 font-medium">Banco</th>
                  <th className="px-4 py-3 font-medium">Consultor</th>
                  <th className="px-4 py-3 font-medium">Contrato</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clientes.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Nenhum cliente cadastrado.</td></tr>
                ) : paged.map(c => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setDetailCliente(c)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-gold shrink-0">
                          {c.nome[0]}
                        </div>
                        <span className="font-medium">{c.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.estabelecimento || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.cnpj || c.cpf || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.telefone || '—'}</td>
                    <td className="px-4 py-3">
                      {c.banco ? (
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${BANCO_DOT[c.banco] || 'bg-muted-foreground'}`} />
                          <span className="text-xs font-medium">{c.banco}</span>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.consultor || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{fmt.date(c.data_contrato)}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setDetailCliente(c)}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {role?.canExcluir && (
                          <button onClick={() => handleDelete(c)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm">
            <span className="text-muted-foreground">{clientes.length} clientes · pág. {page}/{totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted disabled:opacity-40 transition">Anterior</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted disabled:opacity-40 transition">Próxima</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {detailCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDetailCliente(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{detailCliente.nome}</h2>
              <div className="flex gap-2">
                {role?.canEditar && (
                  <button onClick={() => { setEditing(detailCliente); setEditModal(true); setDetailCliente(null) }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition">Editar</button>
                )}
                <button onClick={() => setDetailCliente(null)} className="text-muted-foreground hover:text-foreground">
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ['Estabelecimento', detailCliente.estabelecimento],
                ['CPF', detailCliente.cpf],
                ['CNPJ', detailCliente.cnpj],
                ['Telefone', detailCliente.telefone],
                ['Banco', detailCliente.banco],
                ['Consultor', detailCliente.consultor],
                ['Data do Contrato', fmt.date(detailCliente.data_contrato)],
                ['Qtd. Parcelas', String(detailCliente.qtd_parcelas)],
                ['Valor Total', fmt.brl(detailCliente.valor_parcela)],
                ['CEP', detailCliente.cep],
                ['Referências', detailCliente.referencias],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-right max-w-[60%]">{value || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ClienteModal
        open={editModal}
        onClose={() => setEditModal(false)}
        cliente={editing}
        onSaved={() => { load(); setDetailCliente(null) }}
      />
    </>
  )
}
