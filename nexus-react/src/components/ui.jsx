// src/components/ui.jsx
// Todos os componentes visuais reutilizáveis em um lugar

import { STATUS_CONFIG } from '../utils/api'

// ── Badge de status ───────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['a_pagar']
  return <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
}

// ── Select de status ──────────────────────────────────────────────────────
export function StatusSelect({ value, onChange, disabled }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="sel text-xs py-1.5 px-2 text-tx-1 font-semibold"
      style={{ minWidth: 140 }}
    >
      {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
        <option key={val} value={val}>{cfg.label}</option>
      ))}
    </select>
  )
}

// ── Botão primário ────────────────────────────────────────────────────────
export function Button({ children, onClick, type = 'button', variant = 'primary', size = 'md', disabled, className = '' }) {
  const base = 'inline-flex items-center gap-2 font-bold rounded-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-brand text-white hover:bg-blue-600 active:scale-[0.98] shadow-[0_2px_12px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.45)]',
    ghost:   'bg-transparent text-tx-2 border border-line hover:bg-ink-3 hover:text-tx-1',
    danger:  'bg-danger/15 text-danger border border-danger/20 hover:bg-danger hover:text-white',
    success: 'bg-success/15 text-success border border-success/20 hover:bg-success hover:text-white',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────
export function Input({ label, id, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-tx-3 uppercase tracking-wide">
          {label}
        </label>
      )}
      <input id={id} className={`inp ${error ? 'border-danger' : ''} ${className}`} {...props} />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  )
}

// ── Textarea ──────────────────────────────────────────────────────────────
export function Textarea({ label, id, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={id} className="text-xs font-semibold text-tx-3 uppercase tracking-wide">{label}</label>}
      <textarea id={id} className="inp resize-none" {...props} />
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────────────────
export function Select({ label, id, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={id} className="text-xs font-semibold text-tx-3 uppercase tracking-wide">{label}</label>}
      <select id={id} className={`sel ${className}`} {...props}>{children}</select>
    </div>
  )
}

// ── Card surface ──────────────────────────────────────────────────────────
export function Card({ children, className = '', noPad }) {
  return (
    <div className={`bg-ink-2 border border-line rounded-lg shadow-card overflow-hidden ${!noPad ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  )
}

// ── KPI card ──────────────────────────────────────────────────────────────
export function KpiCard({ label, value, icon: Icon, color }) {
  const colors = {
    blue:   { bar: 'bg-brand',   icon: 'bg-brand/15 text-brand',   glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]' },
    green:  { bar: 'bg-success', icon: 'bg-success/15 text-success',glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]' },
    amber:  { bar: 'bg-warn',    icon: 'bg-warn/15 text-warn',      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]' },
    red:    { bar: 'bg-danger',  icon: 'bg-danger/15 text-danger',  glow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]' },
    purple: { bar: 'bg-purple',  icon: 'bg-purple/15 text-purple',  glow: 'shadow-[0_0_20px_rgba(167,139,250,0.15)]' },
  }
  const c = colors[color] || colors.blue
  return (
    <div className={`relative bg-ink-2 border border-line rounded-md p-5 flex items-center gap-4 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${c.glow}`}>
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${c.bar}`} />
      <div className={`w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0 ${c.icon}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-2xl font-extrabold text-tx-1 leading-none tracking-tight">{value}</div>
        <div className="text-xs text-tx-3 font-semibold uppercase tracking-wide mt-1">{label}</div>
      </div>
    </div>
  )
}

// ── Skeleton loader ───────────────────────────────────────────────────────
export function Skeleton({ rows = 5 }) {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="skeleton h-4 flex-1" style={{ opacity: 1 - i * 0.15 }} />
          <div className="skeleton h-4 w-24" style={{ opacity: 1 - i * 0.15 }} />
          <div className="skeleton h-4 w-20" style={{ opacity: 1 - i * 0.15 }} />
        </div>
      ))}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────
export function EmptyState({ message = 'Nenhum resultado encontrado.' }) {
  return (
    <tr>
      <td colSpan={99} className="text-center py-16 text-tx-3 text-sm italic">{message}</td>
    </tr>
  )
}

// ── Progress bar ──────────────────────────────────────────────────────────
export function Progress({ value, max, className = '' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div>
      <div className="text-sm font-bold whitespace-nowrap">
        <span className="text-tx-1">{value}</span>
        <span className="text-tx-3 font-normal">/{max}</span>
      </div>
      <div className="mt-1 h-1 w-20 bg-ink-4 rounded">
        <div className="h-1 bg-success rounded transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
