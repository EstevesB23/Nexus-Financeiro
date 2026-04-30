/* ══════════════════════════════════════
   XCREDIT FINANCEIRA — app.js v3.0 (produção)
   JWT Auth + API REST + Boas Práticas
══════════════════════════════════════ */
'use strict';

const API = '/api';

// ════════════════════════════════════════
// TOKEN MANAGEMENT
// ════════════════════════════════════════
const token = {
  get:     ()      => sessionStorage.getItem('nxf_token'),
  set:     (t)     => sessionStorage.setItem('nxf_token', t),
  clear:   ()      => sessionStorage.removeItem('nxf_token'),
  payload: ()      => {
    const t = token.get();
    if (!t) return null;
    try { return JSON.parse(atob(t.split('.')[1])); } catch { return null; }
  },
  isExpired: () => {
    const p = token.payload();
    if (!p) return true;
    return Date.now() / 1000 > p.exp;
  },
};

const session = {
  get:   ()  => { try { return JSON.parse(sessionStorage.getItem('nxf_user')); } catch { return null; } },
  set:   (u) => sessionStorage.setItem('nxf_user', JSON.stringify(u)),
  clear: ()  => { sessionStorage.removeItem('nxf_user'); token.clear(); },
};

// ════════════════════════════════════════
// HTTP HELPERS (com JWT automático)
// ════════════════════════════════════════
const buildHeaders = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...(token.get() ? { Authorization: `Bearer ${token.get()}` } : {}),
  ...extra,
});

const handleResponse = async (res) => {
  if (res.status === 401) { logout(); return Promise.reject(new Error('Sessão expirada.')); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return Promise.reject(new Error(data.erro || `Erro ${res.status}`));
  return data;
};

const http = {
  get:    (url)       => fetch(API + url, { headers: buildHeaders() }).then(handleResponse),
  post:   (url, body) => fetch(API + url, { method: 'POST',   headers: buildHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  put:    (url, body) => fetch(API + url, { method: 'PUT',    headers: buildHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  patch:  (url, body) => fetch(API + url, { method: 'PATCH',  headers: buildHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  delete: (url)       => fetch(API + url, { method: 'DELETE', headers: buildHeaders() }).then(handleResponse),
};

// ════════════════════════════════════════
// PERMISSÕES
// ════════════════════════════════════════
const ROLES = {
  admin:         { label:'Administrador', badge:'badge-tb-admin',    tabs:['clientes','financeiro','dashboard','inadimplentes'], canCadastrar:true,  canEditar:true,  canExcluir:true,  canStatus:true  },
  cobranca:      { label:'Cobrança',      badge:'badge-tb-cobranca', tabs:['clientes','financeiro'],                             canCadastrar:true,  canEditar:true,  canExcluir:false, canStatus:true  },
  inadimplencia: { label:'Inadimplência', badge:'badge-tb-inad',     tabs:['inadimplentes'],                                    canCadastrar:false, canEditar:false, canExcluir:false, canStatus:false },
  atendimento:   { label:'Atendimento',   badge:'badge-tb-atend',    tabs:['clientes'],                                         canCadastrar:true,  canEditar:true,  canExcluir:false, canStatus:false },
};

const NAV_ITEMS = [
  { id:'clientes',      label:'Clientes',      showCount:true,
    icon:`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>` },
  { id:'financeiro',    label:'Financeiro',
    icon:`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>` },
  { id:'dashboard',     label:'Dashboard',
    icon:`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>` },
  { id:'inadimplentes', label:'Inadimplentes', showAlert:true,
    icon:`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>` },
];

const STATUS_CONFIG = {
  pago:                { label:'Pago',               badge:'badge-pago'       },
  a_pagar:             { label:'A Pagar',            badge:'badge-apagar'     },
  atrasado:            { label:'Atrasado',           badge:'badge-atrasado'   },
  data_diferente:      { label:'Data Diferente',     badge:'badge-datadif'    },
  pagamento_dia:       { label:'Pagamento do Dia',   badge:'badge-pagdia'     },
  um_dia_util:         { label:'1 Dia Útil',         badge:'badge-umdia'      },
  em_acordo:           { label:'Em Acordo',          badge:'badge-acordo'     },
  parcela_promocional: { label:'Parcela Promocional',badge:'badge-promo'      },
  inadimplente:        { label:'Inadimplente',       badge:'badge-inadimp'    },
  protestado:          { label:'Protestado',         badge:'badge-protestado' },
};

const getBadge = (st) => {
  const cfg = STATUS_CONFIG[st] || STATUS_CONFIG['a_pagar'];
  return `<span class="badge ${cfg.badge}">${cfg.label}</span>`;
};

let currentUser = null;
let currentRole = null;

// ════════════════════════════════════════
// PAGINAÇÃO
// ════════════════════════════════════════
const pgState = {
  clientes:      { page:1, size:10 },
  financeiro:    { page:1, size:10 },
  inadimplentes: { page:1, size:10 },
};

// ════════════════════════════════════════
// UTILITÁRIOS
// ════════════════════════════════════════
const fmt = {
  date:    (iso) => { if (!iso) return '—'; const [y,m,d] = iso.split('-'); return `${d}/${m}/${y}`; },
  brl:     (v)   => 'R$ ' + Number(v||0).toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 }),
  today:   ()    => new Date().toISOString().split('T')[0],
  addDays: (iso, days) => { const d = new Date(iso+'T12:00:00'); d.setDate(d.getDate()+days); return d.toISOString().split('T')[0]; },
};

const toast = (msg, type='success') => {
  const icons = { success:'✓', error:'✕', info:'ℹ', warn:'⚠' };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span>${icons[type]||'•'}</span><span>${msg}</span>`;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => { el.style.opacity='0'; el.style.transform='translateX(20px)'; el.style.transition='.3s'; setTimeout(()=>el.remove(),300); }, 4000);
};

// ════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════
const loginScreen = document.getElementById('login-screen');
const appShell    = document.getElementById('app-shell');

const showError = (msg) => {
  const el = document.getElementById('lf-error');
  document.getElementById('lf-error-msg').textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 5000);
};

document.getElementById('lf-eye').addEventListener('click', () => {
  const inp = document.getElementById('lf-pass');
  const icon = document.getElementById('eye-icon');
  if (inp.type === 'password') {
    inp.type = 'text';
    icon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;
  } else {
    inp.type = 'password';
    icon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
  }
});


document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('.lf-submit');
  btn.classList.add('loading');
  btn.querySelector('span').textContent = 'Entrando…';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: document.getElementById('lf-user').value.trim(),
        password: document.getElementById('lf-pass').value,
      }),
    });

    const data = await res.json();
    if (!res.ok) { showError(data.erro || 'Erro ao fazer login.'); return; }

    token.set(data.token);
    session.set(data.user);
    bootApp(data.user);
  } catch {
    showError('Erro de conexão. Verifique se o servidor está rodando.');
  } finally {
    btn.classList.remove('loading');
    btn.querySelector('span').textContent = 'Entrar';
  }
});

// ════════════════════════════════════════
// BOOT APP
// ════════════════════════════════════════
const bootApp = (user) => {
  currentUser = user;
  currentRole = ROLES[user.role];

  loginScreen.style.transition = 'opacity 0.4s ease';
  loginScreen.style.opacity    = '0';
  setTimeout(() => {
    loginScreen.style.display = 'none';
    appShell.style.display    = 'flex';
    appShell.style.opacity    = '0';
    appShell.style.transition = 'opacity 0.35s ease';
    requestAnimationFrame(() => { appShell.style.opacity = '1'; });
  }, 400);

  setupNav();
  setupTopbar();
  initApp();
};

// ════════════════════════════════════════
// NAV + TOPBAR
// ════════════════════════════════════════
const setupNav = () => {
  const nav = document.getElementById('sb-nav');
  nav.innerHTML = '';
  NAV_ITEMS.forEach(item => {
    const btn = document.createElement('button');
    btn.className   = 'sb-item';
    btn.dataset.tab = item.id;
    btn.innerHTML   = `
      <span class="sb-ico">${item.icon}</span>
      <span>${item.label}</span>
      ${item.showCount ? `<span class="sb-pill" id="sb-count">0</span>` : ''}
      ${item.showAlert ? `<span class="sb-alert" id="sb-alert" style="display:none">!</span>` : ''}`;
    btn.addEventListener('click', () => navigateTo(item.id));
    nav.appendChild(btn);
  });

  const initials = currentUser.nome.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('sb-ava').textContent   = initials;
  document.getElementById('sb-uname').textContent = currentUser.nome;
  document.getElementById('sb-urole').textContent = currentRole.label;
};

const setupTopbar = () => {
  const now  = new Date();
  const opts = { weekday:'short', day:'2-digit', month:'short', year:'numeric' };
  document.getElementById('topbar-date').textContent = now.toLocaleDateString('pt-BR', opts).replace(',','');

  const badge = document.getElementById('topbar-badge');
  badge.textContent = currentRole.label;
  badge.className   = `topbar-badge ${currentRole.badge}`;

  document.getElementById('btn-abrir-modal').style.display = currentRole.canCadastrar ? 'inline-flex' : 'none';
  document.getElementById('btn-logout').addEventListener('click', logout);
};

const logout = () => {
  session.clear();
  appShell.style.transition = 'opacity 0.3s ease';
  appShell.style.opacity    = '0';
  setTimeout(() => {
    appShell.style.display = 'none';
    appShell.style.opacity = '';
    loginScreen.style.opacity = '0';
    loginScreen.style.display = 'flex';
    requestAnimationFrame(() => { loginScreen.style.transition='opacity .35s ease'; loginScreen.style.opacity='1'; });
    document.getElementById('login-form').reset();
    document.getElementById('lf-error').classList.remove('show');
    currentUser = null; currentRole = null;
  }, 300);
};

// ════════════════════════════════════════
// NAVEGAÇÃO
// ════════════════════════════════════════
const TABS_LABEL = { clientes:'Clientes', financeiro:'Financeiro', dashboard:'Dashboard', inadimplentes:'Inadimplentes' };

const navigateTo = (tabId) => {
  document.querySelectorAll('.sb-item').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.sb-item[data-tab="${tabId}"]`);
  if (btn) btn.classList.add('active');

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const allowed = currentRole.tabs.includes(tabId);

  if (allowed) {
    document.getElementById('tab-' + tabId)?.classList.add('active');
    document.getElementById('crumb-current').textContent = TABS_LABEL[tabId];
    if (tabId === 'dashboard')      renderDash();
    if (tabId === 'inadimplentes')  renderInad();
    if (tabId === 'financeiro')     renderFin();
    if (tabId === 'clientes')       renderClientes();
  } else {
    document.getElementById('tab-denied').classList.add('active');
    document.getElementById('crumb-current').textContent = 'Acesso Restrito';
  }

  const showBtn = currentRole.canCadastrar && (tabId === 'clientes' || tabId === 'financeiro');
  document.getElementById('btn-abrir-modal').style.display = showBtn ? 'inline-flex' : 'none';
};

// ════════════════════════════════════════
// INIT
// ════════════════════════════════════════
const initApp = () => {
  applyMasks();
  popularAnos();

  document.getElementById('btn-abrir-modal').addEventListener('click', openModal);
  document.getElementById('btn-fechar').addEventListener('click', closeModal);
  document.getElementById('btn-cancel').addEventListener('click', closeModal);
  document.getElementById('overlay').addEventListener('click', e => { if(e.target === document.getElementById('overlay')) closeModal(); });
  document.getElementById('form-cliente').addEventListener('submit', saveCliente);

  ['filtro-mes','filtro-ano','filtro-status'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => { pgState.financeiro.page=1; renderFin(); });
  });
  document.getElementById('busca-fin').addEventListener('input', debounce(() => { pgState.financeiro.page=1; renderFin(); }, 300));
  document.getElementById('busca-cliente').addEventListener('input', debounce(() => { pgState.clientes.page=1; renderClientes(); }, 300));

  navigateTo(currentRole.tabs[0] || 'clientes');
  updateSidebarBadge();
};

// Debounce helper
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

// ════════════════════════════════════════
// MÁSCARAS
// ════════════════════════════════════════
const applyMasks = () => {
  document.getElementById('f-cpf').addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g,'').slice(0,11);
    v = v.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2');
    e.target.value = v;
  });
  document.getElementById('f-cnpj').addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g,'').slice(0,14);
    v = v.replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3')
         .replace(/\.(\d{3})(\d)/,'.$1/$2').replace(/(\d{4})(\d)/,'$1-$2');
    e.target.value = v;
  });
  document.getElementById('f-cep').addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g,'').slice(0,8);
    e.target.value = v.replace(/(\d{5})(\d)/,'$1-$2');
  });
  document.getElementById('f-tel').addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g,'').slice(0,11);
    e.target.value = v.length > 10
      ? v.replace(/(\d{2})(\d{5})(\d{4})/,'($1) $2-$3')
      : v.replace(/(\d{2})(\d{4})(\d{4})/,'($1) $2-$3');
  });
};

// ════════════════════════════════════════
// MODAL CLIENTE
// ════════════════════════════════════════
let editandoId = null;

const openModal = () => {
  if (!currentRole.canCadastrar) { toast('Sem permissão para cadastrar.', 'error'); return; }
  editandoId = null;
  document.getElementById('modal-title').textContent = 'Novo Cliente';
  document.getElementById('form-cliente').reset();
  document.getElementById('edit-id').value = '';
  document.getElementById('overlay').classList.add('open');
};

const closeModal = () => {
  document.getElementById('overlay').classList.remove('open');
  editandoId = null;
};

const saveCliente = async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled = true;

  const data = {
    nome:            document.getElementById('f-nome').value.trim(),
    estabelecimento: document.getElementById('f-estab').value.trim(),
    cpf:             document.getElementById('f-cpf').value.trim(),
    cnpj:            document.getElementById('f-cnpj').value.trim(),
    telefone:        document.getElementById('f-tel').value.trim(),
    cep:             document.getElementById('f-cep').value.trim(),
    referencias:     document.getElementById('f-refs').value.trim(),
    data_contrato:   document.getElementById('f-data').value,
    qtd_parcelas:    parseInt(document.getElementById('f-parc').value),
    valor_parcela:   parseFloat(document.getElementById('f-valor').value),
    consultor:       document.getElementById('f-cons').value.trim(),
  };

  try {
    if (editandoId) {
      await http.put(`/clientes/${editandoId}`, data);
      toast('Cliente atualizado com sucesso!');
    } else {
      await http.post('/clientes', data);
      toast('Cliente cadastrado com sucesso!');
    }
    closeModal();
    renderClientes();
    updateSidebarBadge();
    popularAnos();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
};

window.editCliente = async (id) => {
  if (!currentRole.canEditar) { toast('Sem permissão para editar.', 'error'); return; }
  try {
    const c = await http.get(`/clientes/${id}`);
    editandoId = id;
    document.getElementById('modal-title').textContent = 'Editar Cliente';
    document.getElementById('edit-id').value  = c.id;
    document.getElementById('f-nome').value   = c.nome;
    document.getElementById('f-estab').value  = c.estabelecimento;
    document.getElementById('f-cpf').value    = c.cpf  || '';
    document.getElementById('f-cnpj').value   = c.cnpj || '';
    document.getElementById('f-tel').value    = c.telefone || '';
    document.getElementById('f-cep').value    = c.cep  || '';
    document.getElementById('f-data').value   = c.data_contrato;
    document.getElementById('f-parc').value   = c.qtd_parcelas;
    document.getElementById('f-valor').value  = c.valor_parcela;
    document.getElementById('f-cons').value   = c.consultor || '';
    document.getElementById('f-refs').value   = c.referencias || '';
    document.getElementById('overlay').classList.add('open');
  } catch (err) {
    toast(err.message, 'error');
  }
};

window.delCliente = async (id) => {
  if (!currentRole.canExcluir) { toast('Sem permissão para excluir.', 'error'); return; }
  if (!confirm('Excluir este cliente e todas as suas parcelas? Esta ação não pode ser desfeita.')) return;
  try {
    await http.delete(`/clientes/${id}`);
    toast('Cliente excluído.', 'info');
    renderClientes();
    updateSidebarBadge();
  } catch (err) {
    toast(err.message, 'error');
  }
};

// ════════════════════════════════════════
// SIDEBAR BADGE
// ════════════════════════════════════════
const updateSidebarBadge = async () => {
  try {
    const [cli, inad] = await Promise.all([
      http.get('/clientes'),
      http.get('/parcelas?inadimplente=1'),
    ]);
    const count = document.getElementById('sb-count');
    const alert = document.getElementById('sb-alert');
    if (count) count.textContent = cli.length;
    if (alert) alert.style.display = inad.length > 0 ? 'flex' : 'none';
  } catch {}
};

// ════════════════════════════════════════
// PAGINAÇÃO ENGINE
// ════════════════════════════════════════
const buildPag = (containerId, total, pgKey) => {
  const container = document.getElementById(containerId);
  if (!container) return;
  const state      = pgState[pgKey];
  const totalPages = Math.max(1, Math.ceil(total / state.size));
  state.page       = Math.min(state.page, totalPages);
  const from       = total === 0 ? 0 : (state.page-1)*state.size+1;
  const to         = Math.min(state.page*state.size, total);

  let pages = [];
  if (totalPages <= 7) { for (let i=1; i<=totalPages; i++) pages.push(i); }
  else {
    const p = state.page;
    if (p <= 4)              pages = [1,2,3,4,5,'…',totalPages];
    else if (p >= totalPages-3) pages = [1,'…',totalPages-4,totalPages-3,totalPages-2,totalPages-1,totalPages];
    else                     pages = [1,'…',p-1,p,p+1,'…',totalPages];
  }

  container.innerHTML = `
    <div class="pag-size"><span>Linhas:</span>
      <select onchange="changePagSize('${pgKey}','${containerId}',this.value)">
        ${[10,25,50].map(n=>`<option value="${n}" ${state.size==n?'selected':''}>${n}</option>`).join('')}
      </select>
    </div>
    <div class="pag-info">${total===0?'Sem registros':`${from}–${to} de ${total}`}</div>
    <div class="pag-controls">
      <button class="pag-btn" onclick="goPage('${pgKey}','${containerId}',1)" ${state.page===1?'disabled':''}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
      </button>
      <button class="pag-btn" onclick="goPage('${pgKey}','${containerId}',${state.page-1})" ${state.page===1?'disabled':''}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      ${pages.map(p=>p==='…'
        ?`<span class="pag-btn" style="cursor:default;color:var(--tx-3)">…</span>`
        :`<button class="pag-btn ${p===state.page?'active':''}" onclick="goPage('${pgKey}','${containerId}',${p})">${p}</button>`
      ).join('')}
      <button class="pag-btn" onclick="goPage('${pgKey}','${containerId}',${state.page+1})" ${state.page===totalPages?'disabled':''}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
      <button class="pag-btn" onclick="goPage('${pgKey}','${containerId}',${totalPages})" ${state.page===totalPages?'disabled':''}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
      </button>
    </div>`;
};

window.goPage = (pgKey, containerId, page) => {
  pgState[pgKey].page = page;
  if (pgKey==='clientes')      renderClientes();
  if (pgKey==='financeiro')    renderFin();
  if (pgKey==='inadimplentes') renderInad();
};
window.changePagSize = (pgKey, containerId, size) => {
  pgState[pgKey].size = parseInt(size);
  pgState[pgKey].page = 1;
  if (pgKey==='clientes')      renderClientes();
  if (pgKey==='financeiro')    renderFin();
  if (pgKey==='inadimplentes') renderInad();
};

const pageSlice = (arr, pgKey) => {
  const {page, size} = pgState[pgKey];
  return arr.slice((page-1)*size, page*size);
};

// ════════════════════════════════════════
// RENDER CLIENTES
// ════════════════════════════════════════
let _clientes = [];

const renderClientes = async () => {
  const q     = document.getElementById('busca-cliente').value;
  const tbody = document.getElementById('tbody-clientes');
  tbody.innerHTML = `<tr class="empty-state"><td colspan="8" style="color:var(--tx-3)">Carregando…</td></tr>`;

  try {
    _clientes = await http.get(`/clientes${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  } catch (err) {
    toast(err.message, 'error');
    tbody.innerHTML = `<tr class="empty-state"><td colspan="8">Erro ao carregar clientes.</td></tr>`;
    return;
  }

  const thAcoes = document.getElementById('th-acoes');
  if (thAcoes) thAcoes.textContent = (currentRole.canEditar || currentRole.canExcluir) ? 'Ações' : '';

  if (!_clientes.length) {
    tbody.innerHTML = `<tr class="empty-state"><td colspan="8">Nenhum cliente encontrado.</td></tr>`;
    buildPag('pg-clientes', 0, 'clientes');
    document.getElementById('h-total').textContent = 0;
    document.getElementById('h-novos').textContent = 0;
    return;
  }

  const paged = pageSlice(_clientes, 'clientes');
  tbody.innerHTML = paged.map(c => {
    const doc   = c.cnpj || c.cpf || '—';
    const pagas = c.parcelas_pagas  || 0;
    const total = c.total_parcelas  || c.qtd_parcelas || 1;
    const pct   = Math.round((pagas / total) * 100);

    const actions = (currentRole.canEditar || currentRole.canExcluir) ? `
      <div class="row-actions">
        ${currentRole.canEditar  ? `<button class="act-btn act-edit" onclick="editCliente('${c.id}')"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Editar</button>` : ''}
        ${currentRole.canExcluir ? `<button class="act-btn act-del"  onclick="delCliente('${c.id}')"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>Excluir</button>` : ''}
      </div>` : '';

    return `<tr>
      <td><div class="td-name">${c.nome}</div><div class="td-sub">${c.referencias ? c.referencias.slice(0,40) : '—'}</div></td>
      <td>${c.estabelecimento}</td>
      <td class="td-mono">${doc}</td>
      <td>${c.telefone || '—'}</td>
      <td><div style="font-size:.8rem;font-weight:600">${c.consultor || '—'}</div></td>
      <td>
        <div style="white-space:nowrap"><span style="font-weight:700">${pagas}</span><span style="color:var(--tx-3)">/${total}</span></div>
        <div style="margin-top:4px;background:var(--ink-4);border-radius:4px;height:4px;width:80px">
          <div style="background:var(--green);width:${pct}%;height:4px;border-radius:4px"></div>
        </div>
      </td>
      <td class="td-mono">${fmt.date(c.data_contrato)}</td>
      <td>${actions}</td>
    </tr>`;
  }).join('');

  buildPag('pg-clientes', _clientes.length, 'clientes');

  document.getElementById('h-total').textContent = _clientes.length;
  const m = new Date().getMonth()+1, y = new Date().getFullYear();
  document.getElementById('h-novos').textContent = _clientes.filter(c => {
    if (!c.data_contrato) return false;
    const [cy, cm] = c.data_contrato.split('-');
    return parseInt(cm) === m && parseInt(cy) === y;
  }).length;
};

// ════════════════════════════════════════
// RENDER FINANCEIRO
// ════════════════════════════════════════
let _parcelas = [];

const renderFin = async () => {
  const mes    = document.getElementById('filtro-mes').value;
  const ano    = document.getElementById('filtro-ano').value;
  const status = document.getElementById('filtro-status').value;
  const busca  = document.getElementById('busca-fin').value;

  const params = new URLSearchParams();
  if (mes)    params.set('mes',    mes);
  if (ano)    params.set('ano',    ano);
  if (status) params.set('status', status);
  if (busca)  params.set('q',      busca);

  const tbody = document.getElementById('tbody-financeiro');
  tbody.innerHTML = `<tr class="empty-state"><td colspan="8" style="color:var(--tx-3)">Carregando…</td></tr>`;

  try {
    _parcelas = await http.get(`/parcelas?${params}`);
  } catch (err) {
    toast(err.message, 'error');
    tbody.innerHTML = `<tr class="empty-state"><td colspan="8">Erro ao carregar parcelas.</td></tr>`;
    return;
  }

  if (!_parcelas.length) {
    tbody.innerHTML = `<tr class="empty-state"><td colspan="8">Nenhuma parcela encontrada.</td></tr>`;
    buildPag('pg-financeiro', 0, 'financeiro');
    return;
  }

  const paged = pageSlice(_parcelas, 'financeiro');
  tbody.innerHTML = paged.map(p => {
    const st = p.status || 'a_pagar';
    const statusOptions = Object.entries(STATUS_CONFIG).map(([val, cfg]) =>
      `<option value="${val}" ${st===val?'selected':''}>${cfg.label}</option>`
    ).join('');

    const acaoCell = currentRole.canStatus
      ? `<select class="st-select" onchange="changeStatus('${p.id}',this.value)">${statusOptions}</select>`
      : getBadge(st);

    return `<tr>
      <td><div class="td-name">${p.cliente_nome}</div></td>
      <td>${p.estabelecimento}</td>
      <td class="td-mono">${p.cnpj || p.cpf || '—'}</td>
      <td style="text-align:center;font-weight:700">${p.numero_parcela}<span style="color:var(--tx-3);font-weight:400">/${p.total_parcelas}</span></td>
      <td class="td-mono">${fmt.date(p.data_parcela)}</td>
      <td style="font-weight:700">${fmt.brl(p.valor)}</td>
      <td>${getBadge(st)}</td>
      <td>${acaoCell}</td>
    </tr>`;
  }).join('');

  buildPag('pg-financeiro', _parcelas.length, 'financeiro');
};

window.changeStatus = async (id, val) => {
  if (!currentRole.canStatus) { toast('Sem permissão para alterar status.', 'error'); return; }
  try {
    await http.patch(`/parcelas/${id}/status`, { status: val });
    toast('Status atualizado!');
    renderFin();
    updateSidebarBadge();
  } catch (err) {
    toast(err.message, 'error');
    renderFin(); // reverte visualmente
  }
};

const popularAnos = async () => {
  try {
    const anos = await http.get('/parcelas/anos');
    const sel  = document.getElementById('filtro-ano');
    if (!sel)  return;
    const cur  = sel.value;
    sel.innerHTML = '<option value="">Todos os anos</option>' +
      anos.map(a => `<option value="${a}" ${a===cur?'selected':''}>${a}</option>`).join('');
  } catch {}
};

// ════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════
const renderDash = async () => {
  try {
    const d = await http.get('/dashboard');
    document.getElementById('kd-clientes').textContent  = d.kpis.total_clientes || 0;
    document.getElementById('kd-pagas').textContent      = d.kpis.pagas          || 0;
    document.getElementById('kd-pendentes').textContent  = d.kpis.pendentes       || 0;
    document.getElementById('kd-atrasadas').textContent  = d.kpis.atrasadas       || 0;
    document.getElementById('kd-receita').textContent    = fmt.brl(d.kpis.receita_total || 0);
    drawDonut(d.kpis.pagas||0, d.kpis.pendentes||0, d.kpis.atrasadas||0);
    drawBar(d.receitaMensal, d.ano);
    renderProximas();
  } catch (err) {
    toast(err.message, 'error');
  }
};

const drawDonut = (pagas, pendentes, atrasadas) => {
  const canvas = document.getElementById('c-donut');
  const ctx    = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const data   = [pagas, atrasadas, pendentes];
  const colors = ['#10b981','#ef4444','#f59e0b'];
  const labels = ['Pagas','Atrasadas','Pendentes'];
  const total  = data.reduce((a,b) => a+b, 0);
  const cx = canvas.width/2, cy = canvas.height/2, ro = 80, ri = 52;

  if (!total) {
    ctx.beginPath(); ctx.arc(cx,cy,ro,0,Math.PI*2); ctx.strokeStyle='#252d42'; ctx.lineWidth=ro-ri; ctx.stroke();
  } else {
    let start = -Math.PI/2; const gap = 0.03;
    data.forEach((v,i) => {
      if (!v) return;
      const slice = (v/total)*(Math.PI*2-gap*data.length);
      ctx.beginPath(); ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,ro,start+gap/2,start+gap/2+slice);
      ctx.arc(cx,cy,ri,start+gap/2+slice,start+gap/2,true);
      ctx.closePath(); ctx.fillStyle=colors[i]; ctx.fill();
      start += slice + gap;
    });
  }

  document.getElementById('donut-center').innerHTML = `<div class="dc-val">${total}</div><div class="dc-lab">Total</div>`;
  document.getElementById('donut-legend').innerHTML = labels.map((l,i) =>
    `<div class="dl-item"><div class="dl-dot" style="background:${colors[i]}"></div><div class="dl-name">${l}</div><div class="dl-count">${data[i]}</div></div>`
  ).join('');
};

const drawBar = (data = [], anoAtual = new Date().getFullYear()) => {
  const canvas = document.getElementById('c-bar');
  const ctx    = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  document.getElementById('ph-year').textContent = anoAtual;

  const meses    = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const maxVal   = Math.max(...data, 1);
  const padL=55, padR=12, padT=10, padB=28;
  const cW=canvas.width-padL-padR, cH=canvas.height-padT-padB;

  for (let i=0; i<=4; i++) {
    const y = padT+cH-(i/4)*cH;
    ctx.beginPath(); ctx.strokeStyle = i===0?'#252d42':'rgba(37,45,66,0.5)';
    ctx.lineWidth=1; ctx.setLineDash(i===0?[]:[4,4]);
    ctx.moveTo(padL,y); ctx.lineTo(canvas.width-padR,y); ctx.stroke(); ctx.setLineDash([]);
    const lbl = (maxVal*i/4) >= 1000 ? `${(maxVal*i/4/1000).toFixed(1)}k` : Math.round(maxVal*i/4).toString();
    ctx.fillStyle='#4e566e'; ctx.font='9px Plus Jakarta Sans'; ctx.textAlign='right';
    ctx.fillText(lbl, padL-6, y+3);
  }

  const barW=cW/12*0.5, barGap=cW/12*0.5, mesAtual=new Date().getMonth();
  data.forEach((val,i) => {
    const x    = padL+i*(cW/12)+barGap/2;
    const barH = Math.max((val/maxVal)*cH, val>0?3:0);
    const y    = padT+cH-barH;
    const isCur= i===mesAtual;
    const grad = ctx.createLinearGradient(x,y,x,padT+cH);
    grad.addColorStop(0, isCur?'#3b82f6':'#1f2433');
    grad.addColorStop(1, isCur?'rgba(59,130,246,0.3)':'rgba(31,36,51,0.5)');
    ctx.fillStyle=grad; ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x,y,barW,barH,[3,3,0,0]); else ctx.rect(x,y,barW,barH);
    ctx.fill();
    ctx.fillStyle=isCur?'#3b82f6':'#4e566e';
    ctx.font=isCur?'bold 9px Plus Jakarta Sans':'9px Plus Jakarta Sans';
    ctx.textAlign='center'; ctx.fillText(meses[i], x+barW/2, canvas.height-padB+14);
  });
};

const renderProximas = async () => {
  const tbody = document.getElementById('tbody-proximas');
  try {
    const lista = await http.get('/parcelas/proximas');
    if (!lista.length) {
      tbody.innerHTML = `<tr class="empty-state"><td colspan="6">Nenhuma parcela nos próximos 7 dias.</td></tr>`;
      return;
    }
    tbody.innerHTML = lista.map(p => `<tr>
      <td class="td-name">${p.cliente_nome}</td>
      <td>${p.estabelecimento}</td>
      <td style="text-align:center">${p.numero_parcela}/${p.total_parcelas}</td>
      <td class="td-mono">${fmt.date(p.data_parcela)}</td>
      <td style="font-weight:700">${fmt.brl(p.valor)}</td>
      <td>${getBadge(p.status)}</td>
    </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = `<tr class="empty-state"><td colspan="6">Erro ao carregar.</td></tr>`;
  }
};

// ════════════════════════════════════════
// INADIMPLENTES
// ════════════════════════════════════════
let _inad = [];

const renderInad = async () => {
  const tbody = document.getElementById('tbody-inad');
  tbody.innerHTML = `<tr class="empty-state"><td colspan="8" style="color:var(--tx-3)">Carregando…</td></tr>`;

  try {
    const parc = await http.get('/parcelas?inadimplente=1');

    const mapa = {};
    parc.forEach(p => {
      if (!mapa[p.cliente_id]) mapa[p.cliente_id] = {
        nome:p.cliente_nome, estabelecimento:p.estabelecimento,
        telefone:p.telefone, consultor:p.consultor,
        qtd:0, total:0, ultima:'', protestado:false,
      };
      mapa[p.cliente_id].qtd++;
      mapa[p.cliente_id].total += p.valor;
      if (p.data_parcela > mapa[p.cliente_id].ultima) mapa[p.cliente_id].ultima = p.data_parcela;
      if (p.status === 'protestado') mapa[p.cliente_id].protestado = true;
    });

    _inad = Object.values(mapa).sort((a,b) => b.total - a.total);

    document.getElementById('in-cli').textContent  = _inad.length;
    document.getElementById('in-parc').textContent = _inad.reduce((s,x) => s+x.qtd, 0);
    document.getElementById('in-val').textContent  = fmt.brl(_inad.reduce((s,x) => s+x.total, 0));

    const alert = document.getElementById('sb-alert');
    if (alert) alert.style.display = _inad.length > 0 ? 'flex' : 'none';

    if (!_inad.length) {
      tbody.innerHTML = `<tr class="empty-state"><td colspan="8" style="color:var(--green)">🎉 Nenhum inadimplente!</td></tr>`;
      buildPag('pg-inad', 0, 'inadimplentes');
      return;
    }

    const paged = pageSlice(_inad, 'inadimplentes');
    tbody.innerHTML = paged.map(item => {
      const protestadoBadge = item.protestado
        ? `<span class="badge badge-protestado">Protestado</span>`
        : `<span style="color:var(--tx-3);font-size:.75rem">—</span>`;
      return `<tr>
        <td><div class="td-name">${item.nome}</div></td>
        <td>${item.estabelecimento}</td>
        <td>${item.telefone || '—'}</td>
        <td>${item.consultor || '—'}</td>
        <td style="text-align:center"><span style="background:var(--red-dim);color:var(--red);font-weight:800;padding:3px 10px;border-radius:20px;font-size:.78rem">${item.qtd} parcela${item.qtd>1?'s':''}</span></td>
        <td style="font-weight:800;color:var(--red)">${fmt.brl(item.total)}</td>
        <td class="td-mono">${fmt.date(item.ultima)}</td>
        <td>${protestadoBadge}</td>
      </tr>`;
    }).join('');

    buildPag('pg-inad', _inad.length, 'inadimplentes');
  } catch (err) {
    toast(err.message, 'error');
    tbody.innerHTML = `<tr class="empty-state"><td colspan="8">Erro ao carregar inadimplentes.</td></tr>`;
  }
};

// ════════════════════════════════════════
// INIT — verifica sessão existente
// ════════════════════════════════════════
(() => {
  const savedUser = session.get();
  if (savedUser && token.get() && !token.isExpired()) {
    bootApp(savedUser);
  }
})();
