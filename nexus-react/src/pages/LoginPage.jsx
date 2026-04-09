// src/pages/LoginPage.jsx
import { useState } from 'react'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { api, tokenStore, sessionStore } from '../utils/api'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const [form, setForm]       = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username.trim(), password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.erro || 'Credenciais inválidas.'); return }
      login(data.user, data.token)
    } catch {
      setError('Erro de conexão. Verifique se o servidor está rodando.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 relative overflow-hidden bg-ink">

      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="orb w-[500px] h-[500px] bg-brand -top-32 -left-20" style={{ animationDelay: '0s' }} />
        <div className="orb w-[400px] h-[400px] bg-purple -bottom-20 -right-20" style={{ animationDelay: '-3s' }} />
        <div className="orb w-[300px] h-[300px] bg-success top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: '-6s' }} />
        {/* Grid overlay */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(37,45,66,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(37,45,66,0.4) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Card */}
      <div className="glass rounded-xl w-full max-w-sm p-9 animate-[fadeUp_0.5s_cubic-bezier(0.2,0,0,1)] relative z-10">

        {/* Brand */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-md bg-brand flex items-center justify-center flex-shrink-0"
            style={{ boxShadow: '0 0 24px rgba(59,130,246,0.5)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div className="text-lg font-extrabold text-tx-1 leading-none">Nexus</div>
            <div className="text-[0.65rem] text-tx-3 font-semibold uppercase tracking-widest">Financeiro</div>
          </div>
        </div>

        {/* Heading */}
        <div className="mb-7">
          <h1 className="text-2xl font-extrabold text-tx-1 tracking-tight leading-tight">
            Bem-vindo de volta
          </h1>
          <p className="text-sm text-tx-2 mt-1.5">Acesse com suas credenciais</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-[0.7rem] font-bold uppercase tracking-widest text-tx-3 mb-1.5">
              Usuário
            </label>
            <div className="flex items-center gap-2.5 inp px-3 py-0">
              <svg className="text-tx-3 flex-shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                placeholder="Digite seu usuário"
                className="flex-1 bg-transparent border-none outline-none text-tx-1 text-sm py-2.5 placeholder:text-tx-4"
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[0.7rem] font-bold uppercase tracking-widest text-tx-3 mb-1.5">
              Senha
            </label>
            <div className="flex items-center gap-2.5 inp px-3 py-0">
              <svg className="text-tx-3 flex-shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Digite sua senha"
                className="flex-1 bg-transparent border-none outline-none text-tx-1 text-sm py-2.5 placeholder:text-tx-4"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="text-tx-3 hover:text-tx-1 transition-colors p-1 rounded"
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-sm bg-danger/10 border border-danger/20 text-danger text-xs font-medium animate-fade-in">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-sm bg-brand text-white font-bold text-sm transition-all duration-200
              hover:bg-blue-600 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            style={{ boxShadow: '0 4px 16px rgba(59,130,246,0.35)' }}
          >
            <span>{loading ? 'Entrando…' : 'Entrar'}</span>
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>
      </div>
    </div>
  )
}
