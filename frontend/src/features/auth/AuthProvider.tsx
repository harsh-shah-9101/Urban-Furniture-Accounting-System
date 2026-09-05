import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react'
import { authApi } from './api'
import { fromBackendRole } from './roles'
import type { AuthUser, LoginPayload } from '@/types/auth'

const SESSION_KEY = 'ufa:session'

interface StoredSession {
  user: AuthUser
  accessToken: string
}

function readSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as StoredSession) : null
  } catch {
    return null
  }
}

function writeSession(session: StoredSession | null) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

interface AuthContextValue {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  login: (input: LoginPayload) => Promise<AuthUser>
  logout: () => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(() => readSession())

  const login = useCallback(async (input: LoginPayload) => {
    const { user, access_token } = await authApi.login(input)
    const resolved: AuthUser = {
      id: String(user.id),
      name: user.name,
      email: user.email,
      role: fromBackendRole(user.role),
    }
    const next: StoredSession = { user: resolved, accessToken: access_token }
    writeSession(next)
    setSession(next)
    return resolved
  }, [])

  const logout = useCallback(() => {
    writeSession(null)
    setSession(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      isAuthenticated: session !== null,
      login,
      logout,
    }),
    [session, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
