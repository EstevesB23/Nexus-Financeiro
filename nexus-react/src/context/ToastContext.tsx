// src/context/ToastContext.tsx
import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

type Toast = {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

type ToastCtx = {
  toasts: Toast[]
  showToast: (message: string, type?: Toast['type']) => void
}

const ToastContext = createContext<ToastCtx | null>(null)

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = nextId++
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-xl text-sm font-medium shadow-lg pointer-events-auto animate-in slide-in-from-right-4 ${
              t.type === 'success' ? 'bg-emerald-500/90 text-white' :
              t.type === 'error'   ? 'bg-red-500/90 text-white' :
                                     'bg-card text-foreground border border-border'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
