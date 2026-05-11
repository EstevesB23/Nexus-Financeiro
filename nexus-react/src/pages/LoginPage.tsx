// src/pages/LoginPage.tsx
import { useState } from 'react'
import { Lock, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/xcredit-logo.png'

export default function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username || !password) { setError('Preencha usuário e senha.'); return }
    setLoading(true)
    try {
      await login(username.trim(), password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 border-r border-border" style={{ background: 'hsl(var(--sidebar))' }}>
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-xl overflow-hidden ring-1 ring-yellow-400/30 shadow-gold">
            <img src={logo} alt="XCredit Financeira" className="h-full w-full object-cover" />
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight">X-Credit</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground -mt-0.5">Soluções Financeiras</div>
          </div>
        </div>

        <div>
          <h2 className="text-4xl font-semibold tracking-tight leading-tight">
            Cobrança, atendimento e <span className="gradient-text-gold">crédito</span> em uma única plataforma.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md">
            Controle total das parcelas, inadimplência e rentabilidade dos seus parceiros — com a clareza que sua diretoria precisa.
          </p>
        </div>

        <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} XCredit Financeira</div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-8">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-card"
        >
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
            <p className="text-sm text-muted-foreground mt-1">Acesse o painel com suas credenciais.</p>
          </div>

          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Usuário
          </label>
          <div className="relative mb-4">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition"
              placeholder="seu-usuario"
              autoComplete="username"
              required
            />
          </div>

          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Senha
          </label>
          <div className="relative mb-2">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 mt-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg gradient-gold text-gold-foreground font-medium py-2.5 text-sm hover:opacity-95 transition disabled:opacity-60 shadow-gold"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
