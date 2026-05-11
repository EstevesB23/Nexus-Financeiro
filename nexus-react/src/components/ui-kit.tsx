// src/components/ui-kit.tsx
import type { ReactNode } from 'react'
import { STATUS_CONFIG } from '../utils/api'

export function PageHeader({
  title, subtitle, actions,
}: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}

export function StatCard({ label, value, hint, accent, icon }: {
  label: string; value: string; hint?: string
  accent?: 'gold' | 'success' | 'danger' | 'default'; icon?: ReactNode
}) {
  const accentClass = accent === 'gold' ? 'text-gold' : accent === 'success' ? 'text-emerald-400' : accent === 'danger' ? 'text-red-400' : 'text-foreground'
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        {icon && <div className="text-gold/80">{icon}</div>}
      </div>
      <div className={`mt-3 text-2xl font-semibold tracking-tight ${accentClass}`}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gold/5 blur-2xl" />
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status]
  if (cfg) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />{cfg.label}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-current" />{status}
    </span>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
    </div>
  )
}
