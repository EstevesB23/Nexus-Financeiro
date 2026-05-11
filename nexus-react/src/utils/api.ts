// src/utils/api.ts
// Centraliza todas as chamadas HTTP com JWT automático

const BASE = '/api'

// ── Token management ──────────────────────────────────────────────────────
export const tokenStore = {
  get:     ()  => sessionStorage.getItem('nxf_token'),
  set:     (t: string) => sessionStorage.setItem('nxf_token', t),
  clear:   ()  => sessionStorage.removeItem('nxf_token'),
  isValid: ()  => {
    const t = tokenStore.get()
    if (!t) return false
    try {
      const { exp } = JSON.parse(atob(t.split('.')[1]))
      return Date.now() / 1000 < exp
    } catch { return false }
  },
  payload: () => {
    const t = tokenStore.get()
    if (!t) return null
    try { return JSON.parse(atob(t.split('.')[1])) } catch { return null }
  },
}

export const sessionStore = {
  get:   ()  => { try { return JSON.parse(sessionStorage.getItem('nxf_user') || 'null') } catch { return null } },
  set:   (u: unknown) => sessionStorage.setItem('nxf_user', JSON.stringify(u)),
  clear: ()  => { sessionStorage.removeItem('nxf_user'); tokenStore.clear() },
}

// ── HTTP core ─────────────────────────────────────────────────────────────
const headers = (extra: Record<string, string> = {}) => ({
  'Content-Type': 'application/json',
  ...(tokenStore.get() ? { Authorization: `Bearer ${tokenStore.get()}` } : {}),
  ...extra,
})

const handle = async (res: Response) => {
  if (res.status === 401) {
    sessionStore.clear()
    window.location.reload()
    return Promise.reject(new Error('Sessão expirada.'))
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return Promise.reject(new Error(data.erro || `Erro ${res.status}`))
  return data
}

export const api = {
  get:    (url: string)                    => fetch(BASE + url, { headers: headers() }).then(handle),
  post:   (url: string, body: unknown)     => fetch(BASE + url, { method: 'POST',   headers: headers(), body: JSON.stringify(body) }).then(handle),
  put:    (url: string, body: unknown)     => fetch(BASE + url, { method: 'PUT',    headers: headers(), body: JSON.stringify(body) }).then(handle),
  patch:  (url: string, body: unknown)     => fetch(BASE + url, { method: 'PATCH',  headers: headers(), body: JSON.stringify(body) }).then(handle),
  delete: (url: string)                    => fetch(BASE + url, { method: 'DELETE', headers: headers() }).then(handle),
}

// ── Format utils ──────────────────────────────────────────────────────────
export const fmt = {
  date: (iso: string) => {
    if (!iso) return '—'
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y}`
  },
  brl: (v: number | string) =>
    'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  today: () => new Date().toISOString().split('T')[0],
}

// ── Status config ─────────────────────────────────────────────────────────
export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pago:                { label: 'Pago',                color: 'text-emerald-400 bg-emerald-400/10' },
  a_pagar:             { label: 'A Pagar',             color: 'text-blue-400 bg-blue-400/10' },
  atrasado:            { label: 'Atrasado',            color: 'text-red-400 bg-red-400/10' },
  data_diferente:      { label: 'Data Diferente',      color: 'text-amber-400 bg-amber-400/10' },
  pagamento_dia:       { label: 'Pagamento do Dia',    color: 'text-emerald-400 bg-emerald-400/10' },
  um_dia_util:         { label: '1 Dia Útil',          color: 'text-sky-400 bg-sky-400/10' },
  em_acordo:           { label: 'Em Acordo',           color: 'text-violet-400 bg-violet-400/10' },
  parcela_promocional: { label: 'Parcela Promo.',      color: 'text-pink-400 bg-pink-400/10' },
  inadimplente:        { label: 'Inadimplente',        color: 'text-red-500 bg-red-500/10' },
  protestado:          { label: 'Protestado',          color: 'text-orange-500 bg-orange-500/10' },
}

// ── Roles / permissions ───────────────────────────────────────────────────
export const ROLES: Record<string, { label: string; tabs: string[]; canCadastrar: boolean; canEditar: boolean; canExcluir: boolean; canStatus: boolean; canNotes: boolean }> = {
  admin:         { label: 'Administrador', tabs: ['clientes','financeiro','dashboard','inadimplentes','parceiros','aprovacoes'], canCadastrar: true,  canEditar: true,  canExcluir: true,  canStatus: true,  canNotes: true  },
  cobranca:      { label: 'Cobrança',      tabs: ['clientes','financeiro'],                                        canCadastrar: true,  canEditar: true,  canExcluir: false, canStatus: true,  canNotes: true  },
  inadimplencia: { label: 'Inadimplência', tabs: ['inadimplentes'],                                               canCadastrar: false, canEditar: false, canExcluir: false, canStatus: false, canNotes: true  },
  atendimento:   { label: 'Atendimento',   tabs: ['clientes'],                                                    canCadastrar: true,  canEditar: true,  canExcluir: false, canStatus: false, canNotes: false },
}
