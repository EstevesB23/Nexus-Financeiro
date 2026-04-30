// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { tokenStore, sessionStore, ROLES } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restaura sessão ao carregar a página
  useEffect(() => {
    const savedUser = sessionStore.get()
    if (savedUser && tokenStore.isValid()) {
      setUser(savedUser)
    } else {
      sessionStore.clear()
    }
    setLoading(false)
  }, [])

  const login = (userData, token) => {
    tokenStore.set(token)
    sessionStore.set(userData)
    setUser(userData)
  }

  const logout = () => {
    sessionStore.clear()
    setUser(null)
  }

  const role = user ? ROLES[user.role] : null

  return (
    <AuthContext.Provider value={{ user, role, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
