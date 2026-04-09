// src/context/ToastContext.jsx
import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle,
  error:   XCircle,
  info:    Info,
  warn:    AlertTriangle,
}
const COLORS = {
  success: 'border-l-success text-success',
  error:   'border-l-danger text-danger',
  info:    'border-l-brand text-brand',
  warn:    'border-l-warn text-warn',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => {
          const Icon = ICONS[t.type]
          return (
            <div
              key={t.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-md border-l-[3px] min-w-60 max-w-80
                bg-ink-3 border border-line shadow-md animate-fade-up pointer-events-auto
                ${COLORS[t.type]}`}
            >
              <Icon size={16} className="flex-shrink-0" />
              <span className="text-sm font-semibold text-tx-1">{t.msg}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
