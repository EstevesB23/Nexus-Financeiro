// src/components/DataTable.jsx
import { Skeleton, EmptyState } from './ui'

export default function DataTable({ columns, children, loading, empty }) {
  return (
    <div className="bg-ink-2 border border-line rounded-lg overflow-hidden shadow-card">
      <div className="overflow-x-auto">
        <table className="dtable">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} style={col.width ? { width: col.width } : {}}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={columns.length} className="p-0"><Skeleton rows={6} /></td></tr>
              : (empty ? <EmptyState message={empty} /> : children)
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
