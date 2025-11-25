'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  name: string
  role: string
  universityId?: string
}

interface AuthState {
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isAuthenticated: boolean
  getCurrentUser: () => User | null
  authState: AuthState
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('smartSchedule_user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Error parsing stored user:', error)
        localStorage.removeItem('smartSchedule_user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const userData = data.user || {
          id: data.userId || '',
          email: data.email || email,
          name: data.name || '',
          role: data.role || 'STUDENT',
          universityId: data.universityId,
        }

        setUser(userData)
        localStorage.setItem('smartSchedule_user', JSON.stringify(userData))
        localStorage.setItem('smartSchedule_auth', 'true')

        return { success: true }
      } else {
        return { success: false, error: data.error || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('smartSchedule_user')
    localStorage.removeItem('smartSchedule_auth')
  }

  const getCurrentUser = () => {
    return user
  }

  const authState: AuthState = {
    isLoading: loading,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        getCurrentUser,
        authState,
      }}
    >
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

