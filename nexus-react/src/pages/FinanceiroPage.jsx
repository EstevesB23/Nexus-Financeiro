// src/pages/FinanceiroPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { Search, Filter } from 'lucide-react'
import { api, fmt, STATUS_CONFIG } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import { StatusBadge, StatusSelect } from '../components/ui'

const MESES = ['','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const COLS = [
  { label: 'Cliente' },
  { label: 'Estabelecimento' },
  { label: 'Documento' },
  { label: 'Parcela', width: 80 },
  { label: 'Vencimento', width: 110 },
  { label: 'Valor', width: 120 },
  { label: 'Status', width: 160 },
  { label: 'Ação', width: 160 },
]

export default function FinanceiroPage() {
  const { role } = useAuth()
  const toast    = useToast()

  const [parcelas, setParcelas] = useState([])
  const [anos,     setAnos]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)
  const [size,     setSize]     = useState(10)

  const [filtros, setFiltros] = useState({ mes: '', ano: '', status: '', q: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtros.mes)    params.set('mes',    filtros.mes)
      if (filtros.ano)    params.set('ano',    filtros.ano)
      if (filtros.status) params.set('status', filtros.status)
      if (filtros.q)      params.set('q',      filtros.q)
      const data = await api.get(`/parcelas?${params}`)
      setParcelas(data)
      setPage(1)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [filtros])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    api.get('/parcelas/anos').then(setAnos).catch(() => {})
  }, [])

  const setF = (key, value) => setFiltros(prev => ({ ...prev, [key]: value }))

  const handleStatusChange = async (id, novoStatus) => {
    try {
      await api.patch(`/parcelas/${id}/status`, { status: novoStatus })
      toast('Status atualizado!', 'success')
      load()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const paged = parcelas.slice((page - 1) * size, page * size)

  return (
    <div className="animate-fade-up space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-tx-1 tracking-tight leading-tight">
          Controle{' '}
          <em className="not-italic font-bold text-brand" style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic' }}>
            Financeiro
          </em>
        </h1>
        <p className="text-sm text-tx-2 mt-1">Acompanhe e gerencie cada parcela semanal</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 bg-ink-3 border border-line rounded-sm
          focus-within:border-brand focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.08)] transition-all min-w-56">
          <Search size={13} className="text-tx-3 flex-shrink-0" />
          <input
            type="text"
            value={filtros.q}
            onChange={e => setF('q', e.target.value)}
            placeholder="Buscar cliente…"
            className="flex-1 bg-transparent border-none outline-none text-sm text-tx-1 placeholder:text-tx-3"
          />
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <Filter size={13} className="text-tx-3" />
          {/* Mês */}
          <select value={filtros.mes} onChange={e => setF('mes', e.target.value)} className="sel text-sm py-2">
            <option value="">Todos os meses</option>
            {MESES.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>

          {/* Ano */}
          <select value={filtros.ano} onChange={e => setF('ano', e.target.value)} className="sel text-sm py-2">
            <option value="">Todos os anos</option>
            {anos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          {/* Status */}
          <select value={filtros.status} onChange={e => setF('status', e.target.value)} className="sel text-sm py-2">
            <option value="">Todos os status</option>
            {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
              <option key={val} value={val}>{cfg.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <DataTable columns={COLS} loading={loading} empty={parcelas.length === 0 ? 'Nenhuma parcela encontrada.' : undefined}>
        {paged.map(p => (
          <tr key={p.id}>
            <td>
              <div className="font-semibold text-tx-1 leading-snug">{p.cliente_nome}</div>
            </td>
            <td className="text-tx-2 text-sm">{p.estabelecimento}</td>
            <td className="font-mono text-xs text-tx-2">{p.cnpj || p.cpf || '—'}</td>
            <td className="text-center">
              <span className="font-bold text-tx-1">{p.numero_parcela}</span>
              <span className="text-tx-3 text-xs">/{p.total_parcelas}</span>
            </td>
            <td className="font-mono text-xs text-tx-2">{fmt.date(p.data_parcela)}</td>
            <td className="font-bold text-tx-1">{fmt.brl(p.valor)}</td>
            <td><StatusBadge status={p.status || 'a_pagar'} /></td>
            <td>
              {role?.canStatus
                ? <StatusSelect
                    value={p.status || 'a_pagar'}
                    onChange={val => handleStatusChange(p.id, val)}
                  />
                : <StatusBadge status={p.status || 'a_pagar'} />
              }
            </td>
          </tr>
        ))}
      </DataTable>

      {/* Pagination */}
      {!loading && parcelas.length > 0 && (
        <Pagination
          total={parcelas.length}
          page={page}
          size={size}
          onPage={setPage}
          onSize={s => { setSize(s); setPage(1) }}
        />
      )}
    </div>
  )
}
