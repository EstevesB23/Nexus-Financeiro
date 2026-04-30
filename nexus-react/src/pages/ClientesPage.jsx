// src/pages/ClientesPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, UserPlus, Pencil, Trash2 } from 'lucide-react'
import { api, fmt } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import ClienteModal from '../components/ClienteModal'
import { Button, Progress } from '../components/ui'

const BANCO_COLORS = {
  BRADESCO:  'bg-danger/10 text-danger border-danger/20',
  SANTANDER: 'bg-warn/10 text-warn border-warn/20',
  ITAU:      'bg-brand/10 text-brand border-brand/20',
}

const COLS = [
  { label: 'Cliente' },
  { label: 'Estabelecimento' },
  { label: 'Documento' },
  { label: 'Telefone' },
  { label: 'Banco' },
  { label: 'Consultor' },
  { label: 'Parcelas' },
  { label: 'Contrato' },
  { label: '', width: 140 },
]

export default function ClientesPage({ onStatsChange }) {
  const { role } = useAuth()
  const toast    = useToast()

  const [clientes, setClientes] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [q,        setQ]        = useState('')
  const [page,     setPage]     = useState(1)
  const [size,     setSize]     = useState(10)
  const [modal,    setModal]    = useState(false)
  const [editing,  setEditing]  = useState(null)   // null = novo, cliente = editar

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get(`/clientes${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      setClientes(data)
      onStatsChange?.(data.length)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [q])

  useEffect(() => { load() }, [load])

  // Debounce da busca
  useEffect(() => {
    setPage(1)
  }, [q])

  const handleDelete = async (c) => {
    if (!window.confirm(`Excluir "${c.nome}" e todas as suas parcelas?`)) return
    try {
      await api.delete(`/clientes/${c.id}`)
      toast('Cliente excluído.', 'info')
      load()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const openNew  = () => { setEditing(null); setModal(true) }
  const openEdit = (c) => { setEditing(c);   setModal(true) }

  // Paginação local
  const paged   = clientes.slice((page - 1) * size, page * size)
  const mesAtual = new Date().getMonth() + 1
  const anoAtual = new Date().getFullYear()
  const novos   = clientes.filter(c => {
    if (!c.data_contrato) return false
    const [y, m] = c.data_contrato.split('-')
    return parseInt(m) === mesAtual && parseInt(y) === anoAtual
  }).length

  return (
    <div className="animate-fade-up space-y-5">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-tx-1 tracking-tight leading-tight">
            Clientes{' '}
            <em className="not-italic font-bold text-brand" style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic' }}>
              Cadastrados
            </em>
          </h1>
          <p className="text-sm text-tx-2 mt-1">Cadastre e gerencie sua base de clientes</p>
        </div>

        {/* Mini stats */}
        <div className="flex gap-5">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-tx-1 leading-none tracking-tight">{clientes.length}</div>
            <div className="text-[0.68rem] uppercase tracking-wide text-tx-3 font-semibold mt-1">Total</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-success leading-none tracking-tight">{novos}</div>
            <div className="text-[0.68rem] uppercase tracking-wide text-tx-3 font-semibold mt-1">Este mês</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm px-3 py-2 bg-ink-3 border border-line rounded-sm
          focus-within:border-brand focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.08)] transition-all">
          <Search size={13} className="text-tx-3 flex-shrink-0" />
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar nome, CNPJ, CPF, estabelecimento…"
            className="flex-1 bg-transparent border-none outline-none text-sm text-tx-1 placeholder:text-tx-3"
          />
        </div>

        {role?.canCadastrar && (
          <Button onClick={openNew}>
            <Plus size={14} />
            Novo Cliente
          </Button>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={COLS}
        loading={loading}
        empty={clientes.length === 0 ? 'Nenhum cliente cadastrado ainda.' : undefined}
      >
        {paged.map(c => {
          const doc   = c.cnpj || c.cpf || '—'
          return (
            <tr key={c.id}>
              <td>
                <div className="font-semibold text-tx-1 leading-snug">{c.nome}</div>
                <div className="text-[0.71rem] text-tx-3 mt-0.5 truncate max-w-[200px]">
                  {c.referencias?.slice(0, 45) || '—'}
                </div>
              </td>
              <td className="text-tx-2">{c.estabelecimento}</td>
              <td className="font-mono text-xs text-tx-2">{doc}</td>
              <td className="text-tx-2">{c.telefone || '—'}</td>
              <td>
                {c.banco
                  ? <span className={`px-2 py-0.5 rounded text-[0.68rem] font-bold border ${BANCO_COLORS[c.banco] || 'bg-ink-3 text-tx-2 border-line'}`}>{c.banco}</span>
                  : <span className="text-tx-4">—</span>
                }
              </td>
              <td>
                <span className="text-sm font-semibold text-tx-1">{c.consultor || '—'}</span>
              </td>
              <td>
                <Progress value={c.parcelas_pagas || 0} max={c.qtd_parcelas || 1} />
              </td>
              <td className="font-mono text-xs text-tx-2">{fmt.date(c.data_contrato)}</td>
              <td>
                <div className="flex items-center gap-1.5">
                  {role?.canEditar && (
                    <button
                      onClick={() => openEdit(c)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold
                        bg-brand/10 text-brand border border-brand/20 hover:bg-brand hover:text-white transition-all"
                    >
                      <Pencil size={11} /> Editar
                    </button>
                  )}
                  {role?.canExcluir && (
                    <button
                      onClick={() => handleDelete(c)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold
                        bg-danger/10 text-danger border border-danger/20 hover:bg-danger hover:text-white transition-all"
                    >
                      <Trash2 size={11} /> Excluir
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )
        })}
      </DataTable>

      {/* Pagination */}
      {!loading && clientes.length > 0 && (
        <Pagination
          total={clientes.length}
          page={page}
          size={size}
          onPage={p => setPage(p)}
          onSize={s => { setSize(s); setPage(1) }}
        />
      )}

      {/* Modal */}
      <ClienteModal
        open={modal}
        onClose={() => setModal(false)}
        cliente={editing}
        onSaved={load}
      />
    </div>
  )
}
