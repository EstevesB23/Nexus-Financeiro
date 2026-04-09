// src/components/Pagination.jsx
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

export default function Pagination({ total, page, size, onPage, onSize }) {
  const totalPages = Math.max(1, Math.ceil(total / size))
  const from = total === 0 ? 0 : (page - 1) * size + 1
  const to   = Math.min(page * size, total)

  // Build page numbers with ellipsis
  let pages = []
  if (totalPages <= 7) {
    pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  } else if (page <= 4) {
    pages = [1, 2, 3, 4, 5, '…', totalPages]
  } else if (page >= totalPages - 3) {
    pages = [1, '…', totalPages-4, totalPages-3, totalPages-2, totalPages-1, totalPages]
  } else {
    pages = [1, '…', page-1, page, page+1, '…', totalPages]
  }

  const PagBtn = ({ onClick, disabled, active, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 flex items-center justify-center rounded text-sm font-semibold transition-all
        disabled:opacity-30 disabled:cursor-not-allowed
        ${active
          ? 'bg-brand text-white border border-brand'
          : 'bg-ink-3 text-tx-2 border border-line hover:bg-brand hover:text-white hover:border-brand'
        }`}
    >
      {children}
    </button>
  )

  return (
    <div className="flex items-center justify-between px-5 py-3.5 mt-2 bg-ink-2 border border-line rounded-md">
      {/* Rows per page */}
      <div className="flex items-center gap-2 text-xs text-tx-3">
        <span>Linhas:</span>
        <select
          value={size}
          onChange={e => onSize(parseInt(e.target.value))}
          className="sel py-1 px-2 text-xs"
          style={{ minWidth: 60 }}
        >
          {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {/* Info */}
      <span className="text-xs text-tx-3">
        {total === 0 ? 'Sem registros' : `${from}–${to} de ${total}`}
      </span>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <PagBtn onClick={() => onPage(1)} disabled={page === 1}>
          <ChevronsLeft size={12} />
        </PagBtn>
        <PagBtn onClick={() => onPage(page - 1)} disabled={page === 1}>
          <ChevronLeft size={12} />
        </PagBtn>
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-tx-3 text-sm">…</span>
            : <PagBtn key={p} onClick={() => onPage(p)} active={p === page}>{p}</PagBtn>
        )}
        <PagBtn onClick={() => onPage(page + 1)} disabled={page === totalPages}>
          <ChevronRight size={12} />
        </PagBtn>
        <PagBtn onClick={() => onPage(totalPages)} disabled={page === totalPages}>
          <ChevronsRight size={12} />
        </PagBtn>
      </div>
    </div>
  )
}
