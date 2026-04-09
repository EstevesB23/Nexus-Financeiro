// src/pages/InadimplentesPage.jsx
import { useState, useEffect } from 'react'
import { Users, CreditCard, DollarSign } from 'lucide-react'
import { api, fmt } from '../utils/api'
import { useToast } from '../context/ToastContext'
import { KpiCard } from '../components/ui'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'

const COLS = [
  { label: 'Cliente' },
  { label: 'Estabelecimento' },
  { label: 'Telefone', width: 150 },
  { label: 'Consultor' },
  { label: 'Parcelas em Atraso', width: 150 },
  { label: 'Valor Total', width: 140 },
  { label: 'Última Parcela', width: 130 },
  { label: 'Protestado', width: 120 },
]

export default function InadimplentesPage({ onBadge }) {
  const toast   = useToast()
  const [inad,    setInad]    = useState([])
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(1)
  const [size,    setSize]    = useState(10)

  useEffect(() => {
    api.get('/parcelas?inadimplente=1')
      .then(parcelas => {
        // Agrupa por cliente
        const mapa = {}
        parcelas.forEach(p => {
          if (!mapa[p.cliente_id]) mapa[p.cliente_id] = {
            nome: p.cliente_nome, estabelecimento: p.estabelecimento,
            telefone: p.telefone, consultor: p.consultor,
            qtd: 0, total: 0, ultima: '', protestado: false,
          }
          mapa[p.cliente_id].qtd++
          mapa[p.cliente_id].total += p.valor
          if (p.data_parcela > mapa[p.cliente_id].ultima) mapa[p.cliente_id].ultima = p.data_parcela
          if (p.status === 'protestado') mapa[p.cliente_id].protestado = true
        })
        const lista = Object.values(mapa).sort((a, b) => b.total - a.total)
        setInad(lista)
        onBadge?.(lista.length)
      })
      .catch(err => toast(err.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  const totalParcelas = inad.reduce((s, x) => s + x.qtd, 0)
  const totalValor    = inad.reduce((s, x) => s + x.total, 0)
  const paged         = inad.slice((page - 1) * size, page * size)

  return (
    <div className="animate-fade-up space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-tx-1 tracking-tight leading-tight">
          Clientes{' '}
          <em className="not-italic font-bold text-danger" style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic' }}>
            Inadimplentes
          </em>
        </h1>
        <p className="text-sm text-tx-2 mt-1">Parcelas em atraso que precisam de atenção imediata</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Clientes em Atraso" value={inad.length}       icon={Users}       color="red" />
        <KpiCard label="Parcelas Atrasadas" value={totalParcelas}     icon={CreditCard}  color="amber" />
        <KpiCard label="Valor em Aberto"    value={fmt.brl(totalValor)} icon={DollarSign} color="purple" />
      </div>

      {/* Table */}
      <DataTable
        columns={COLS}
        loading={loading}
        empty={inad.length === 0 ? '🎉 Nenhum inadimplente!' : undefined}
      >
        {paged.map((item, idx) => (
          <tr key={idx}>
            <td className="font-semibold text-tx-1">{item.nome}</td>
            <td className="text-tx-2 text-sm">{item.estabelecimento}</td>
            <td className="text-tx-2 text-sm">{item.telefone || '—'}</td>
            <td className="text-tx-2 text-sm">{item.consultor || '—'}</td>
            <td>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-danger/15 text-danger">
                {item.qtd} parcela{item.qtd !== 1 ? 's' : ''}
              </span>
            </td>
            <td className="font-extrabold text-danger">{fmt.brl(item.total)}</td>
            <td className="font-mono text-xs text-tx-2">{fmt.date(item.ultima)}</td>
            <td>
              {item.protestado
                ? <span className="badge badge-protestado">Protestado</span>
                : <span className="text-tx-3 text-xs">—</span>
              }
            </td>
          </tr>
        ))}
      </DataTable>

      {/* Pagination */}
      {!loading && inad.length > 0 && (
        <Pagination
          total={inad.length}
          page={page}
          size={size}
          onPage={setPage}
          onSize={s => { setSize(s); setPage(1) }}
        />
      )}
    </div>
  )
}
