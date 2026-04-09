// src/utils/api.js
// Centraliza todas as chamadas HTTP com JWT automático

const BASE = '/api'

// ── Token management ──────────────────────────────────────────────────────
export const tokenStore = {
  get:      ()  => sessionStorage.getItem('nxf_token'),
  set:      (t) => sessionStorage.setItem('nxf_token', t),
  clear:    ()  => sessionStorage.removeItem('nxf_token'),
  isValid:  ()  => {
    const t = tokenStore.get()
    if (!t) return false
    try {
      const { exp } = JSON.parse(atob(t.split('.')[1]))
      return Date.now() / 1000 < exp
    } catch { return false }
  },
  payload:  ()  => {
    const t = tokenStore.get()
    if (!t) return null
    try { return JSON.parse(atob(t.split('.')[1])) } catch { return null }
  },
}

export const sessionStore = {
  get:   ()  => { try { return JSON.parse(sessionStorage.getItem('nxf_user')) } catch { return null } },
  set:   (u) => sessionStorage.setItem('nxf_user', JSON.stringify(u)),
  clear: ()  => { sessionStorage.removeItem('nxf_user'); tokenStore.clear() },
}

// ── HTTP core ─────────────────────────────────────────────────────────────
const headers = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...(tokenStore.get() ? { Authorization: `Bearer ${tokenStore.get()}` } : {}),
  ...extra,
})

const handle = async (res) => {
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
  get:    (url)       => fetch(BASE + url, { headers: headers() }).then(handle),
  post:   (url, body) => fetch(BASE + url, { method: 'POST',   headers: headers(), body: JSON.stringify(body) }).then(handle),
  put:    (url, body) => fetch(BASE + url, { method: 'PUT',    headers: headers(), body: JSON.stringify(body) }).then(handle),
  patch:  (url, body) => fetch(BASE + url, { method: 'PATCH',  headers: headers(), body: JSON.stringify(body) }).then(handle),
  delete: (url)       => fetch(BASE + url, { method: 'DELETE', headers: headers() }).then(handle),
}

// ── Format utils ──────────────────────────────────────────────────────────
export const fmt = {
  date: (iso) => {
    if (!iso) return '—'
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y}`
  },
  brl: (v) =>
    'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  today: () => new Date().toISOString().split('T')[0],
}

// ── Status config ─────────────────────────────────────────────────────────
export const STATUS_CONFIG = {
  pago:                { label: 'Pago',                badge: 'badge-pago' },
  a_pagar:             { label: 'A Pagar',             badge: 'badge-apagar' },
  atrasado:            { label: 'Atrasado',            badge: 'badge-atrasado' },
  data_diferente:      { label: 'Data Diferente',      badge: 'badge-datadif' },
  pagamento_dia:       { label: 'Pagamento do Dia',    badge: 'badge-pagdia' },
  um_dia_util:         { label: '1 Dia Útil',          badge: 'badge-umdia' },
  em_acordo:           { label: 'Em Acordo',           badge: 'badge-acordo' },
  parcela_promocional: { label: 'Parcela Promocional', badge: 'badge-promo' },
  inadimplente:        { label: 'Inadimplente',        badge: 'badge-inadimp' },
  protestado:          { label: 'Protestado',          badge: 'badge-protestado' },
}

// ── Roles / permissions ───────────────────────────────────────────────────
export const ROLES = {
  admin:         { label: 'Administrador', tabs: ['clientes','financeiro','dashboard','inadimplentes'], canCadastrar: true,  canEditar: true,  canExcluir: true,  canStatus: true  },
  cobranca:      { label: 'Cobrança',      tabs: ['clientes','financeiro'],                             canCadastrar: true,  canEditar: true,  canExcluir: false, canStatus: true  },
  inadimplencia: { label: 'Inadimplência', tabs: ['inadimplentes'],                                    canCadastrar: false, canEditar: false, canExcluir: false, canStatus: false },
  atendimento:   { label: 'Atendimento',   tabs: ['clientes'],                                         canCadastrar: true,  canEditar: true,  canExcluir: false, canStatus: false },
}
