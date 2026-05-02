import { createContext, useContext, useEffect, useState } from 'react'
import { api, TOKEN_STORAGE_KEY } from '../api/client'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (payload: { username: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  syncUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)

    if (!token) {
      setIsLoading(false)
      return
    }

    api
      .get<{ user: User }>('/auth/me')
      .then((response) => {
        setUser(response.data.user)
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        setUser(null)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  async function login(payload: { username: string; password: string }) {
    const response = await api.post<{ token: string; user: User }>('/auth/login', payload)

    localStorage.setItem(TOKEN_STORAGE_KEY, response.data.token)
    setUser(response.data.user)
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } catch {
      // Intentionally ignore logout transport errors and clear local auth state.
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      setUser(null)
    }
  }

  function syncUser(nextUser: User) {
    setUser(nextUser)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, syncUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
