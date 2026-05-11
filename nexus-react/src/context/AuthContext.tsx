// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { tokenStore, sessionStore, ROLES, api } from '../utils/api'

type User = {
  id: string
  username: string
  nome: string
  role: string
}

type RoleConfig = {
  label: string
  tabs: string[]
  canCadastrar: boolean
  canEditar: boolean
  canExcluir: boolean
  canStatus: boolean
}

type AuthCtx = {
  user: User | null
  role: RoleConfig | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = sessionStore.get()
    if (savedUser && tokenStore.isValid()) {
      setUser(savedUser)
    } else {
      sessionStore.clear()
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    const data = await api.post('/auth/login', { username, password })
    tokenStore.set(data.token)
    sessionStore.set(data.user)
    setUser(data.user)
  }

  const logout = () => {
    sessionStore.clear()
    setUser(null)
  }

  const role = user ? ROLES[user.role] || null : null

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
