// src/components/Modal.jsx
import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ title, icon: Icon, open, onClose, children, maxWidth = 'max-w-2xl' }) {
  // Fecha com Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto bg-ink-2 border border-line rounded-xl shadow-lg animate-[slideUp_0.28s_cubic-bezier(0.2,0,0,1)]`}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b border-line bg-ink-2 rounded-t-xl">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-9 h-9 rounded-sm bg-brand/15 flex items-center justify-center text-brand">
                <Icon size={16} />
              </div>
            )}
            <h2 className="text-base font-extrabold text-tx-1 tracking-tight">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded bg-ink-3 border border-line text-tx-2 hover:bg-danger/15 hover:text-danger hover:border-danger/30 transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ── Fieldset para agrupar campos no modal ──────────────────────────────────
export function FieldGroup({ title, children }) {
  return (
    <fieldset className="border border-line rounded-md p-4 mb-4">
      <legend className="text-xs font-bold uppercase tracking-wider text-brand px-1.5 -ml-1.5">
        {title}
      </legend>
      {children}
    </fieldset>
  )
}
