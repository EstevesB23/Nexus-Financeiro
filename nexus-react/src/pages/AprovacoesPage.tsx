// src/pages/AprovacoesPage.tsx
import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle, ClipboardCheck, Building2, User, Calendar, CreditCard, Hash } from 'lucide-react'
import { api, fmt } from '../utils/api'
import { useToast } from '../context/ToastContext'
import { PageHeader, Spinner } from '../components/ui-kit'

type ClientePendente = {
  id: string
  nome: string
  estabelecimento: string
  cpf: string
  cnpj: string
  telefone: string
  banco: string
  consultor: string
  data_contrato: string
  qtd_parcelas: number
  valor_parcela: number
  referencias: string
  criado_em: string
}

type RejeicaoState = { id: string; motivo: string } | null

export default function AprovacoesPage({ onBadgeChange }: { onBadgeChange?: (n: number) => void }) {
  const { showToast } = useToast()
  const [clientes, setClientes] = useState<ClientePendente[]>([])
  const [loading, setLoading] = useState(true)
  const [rejeicao, setRejeicao] = useState<RejeicaoState>(null)
  const [saving, setSaving] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/aprovacoes')
      .then((data: ClientePendente[]) => {
        setClientes(data)
        onBadgeChange?.(data.length)
      })
      .catch(err => showToast(err instanceof Error ? err.message : 'Erro ao carregar', 'error'))
      .finally(() => setLoading(false))
  }, [onBadgeChange, showToast])

  useEffect(() => { load() }, [load])

  const agir = async (id: string, acao: 'aprovar' | 'rejeitar', motivo?: string) => {
    setSaving(id)
    try {
      await api.put(`/aprovacoes/${id}`, { acao, motivo })
      showToast(acao === 'aprovar' ? 'Cliente aprovado!' : 'Cliente rejeitado.', acao === 'aprovar' ? 'success' : 'error')
      setRejeicao(null)
      load()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro', 'error')
    } finally {
      setSaving(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Aprovações"
        subtitle="Novos cadastros aguardando aprovação do administrador"
      />

      {loading ? (
        <Spinner />
      ) : clientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <ClipboardCheck className="h-8 w-8 text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Nenhuma aprovação pendente</p>
            <p className="text-sm text-muted-foreground mt-1">Todos os cadastros foram revisados.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {clientes.map(c => (
            <div key={c.id} className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              {/* Header do card */}
              <div className="flex items-start justify-between p-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center text-sm font-bold text-gold-foreground shrink-0">
                    {c.nome[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{c.nome}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Building2 className="h-3 w-3" /> {c.estabelecimento}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wide">
                  Pendente
                </span>
              </div>

              {/* Detalhes */}
              <div className="p-5 grid grid-cols-2 gap-3 text-sm">
                {c.banco && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{c.banco}</span>
                  </div>
                )}
                {c.consultor && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{c.consultor}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span>{fmt.date(c.data_contrato)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Hash className="h-3.5 w-3.5 shrink-0" />
                  <span>{c.qtd_parcelas}x</span>
                </div>
              </div>

              {/* Valor */}
              <div className="px-5 pb-4 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Valor total:</span>
                <span className="text-lg font-bold text-gold tabular-nums">
                  {fmt.brl(c.valor_parcela)}
                </span>
              </div>

              {/* Motivo de rejeição (inline) */}
              {rejeicao?.id === c.id && (
                <div className="px-5 pb-4">
                  <textarea
                    value={rejeicao.motivo}
                    onChange={e => setRejeicao({ id: c.id, motivo: e.target.value })}
                    placeholder="Motivo da rejeição (opcional)..."
                    rows={2}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gold transition resize-none"
                  />
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-2 px-5 pb-5">
                {rejeicao?.id === c.id ? (
                  <>
                    <button
                      onClick={() => agir(c.id, 'rejeitar', rejeicao.motivo)}
                      disabled={saving === c.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-semibold hover:bg-red-500/20 transition disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      {saving === c.id ? 'Aguarde...' : 'Confirmar rejeição'}
                    </button>
                    <button
                      onClick={() => setRejeicao(null)}
                      disabled={saving === c.id}
                      className="px-4 py-2 rounded-lg border border-border text-muted-foreground text-sm hover:text-foreground transition"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => agir(c.id, 'aprovar')}
                      disabled={saving === c.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-semibold hover:bg-emerald-500/20 transition disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {saving === c.id ? 'Aguarde...' : 'Aprovar'}
                    </button>
                    <button
                      onClick={() => setRejeicao({ id: c.id, motivo: '' })}
                      disabled={saving === c.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-semibold hover:bg-red-500/20 transition disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Rejeitar
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
