'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthService, AuthState, User } from '../lib/auth'

interface AuthContextType {
  authState: AuthState
  login: (email: string, password: string, role: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isAuthenticated: () => boolean
  getCurrentUser: () => User | null
  hasRole: (role: User['role']) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Initialize auth service
    const authService = AuthService.getInstance()
    authService.initialize()

    // Subscribe to auth state changes
    const unsubscribe = authService.subscribe((state) => {
      setAuthState(state)
    })

    return unsubscribe
  }, [])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>
  }

  const login = async (email: string, password: string, role: string) => {
    const authService = AuthService.getInstance()
    return authService.login(email, password, role)
  }

  const logout = () => {
    const authService = AuthService.getInstance()
    authService.logout()
  }

  const isAuthenticated = () => {
    const authService = AuthService.getInstance()
    return authService.isAuthenticated()
  }

  const getCurrentUser = () => {
    const authService = AuthService.getInstance()
    return authService.getCurrentUser()
  }

  const hasRole = (role: User['role']) => {
    const authService = AuthService.getInstance()
    return authService.hasRole(role)
  }

  return (
    <AuthContext.Provider value={{
      authState,
      login,
      logout,
      isAuthenticated,
      getCurrentUser,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
