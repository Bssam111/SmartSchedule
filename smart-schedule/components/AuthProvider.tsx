'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getApiBaseUrl } from '@/lib/api-utils'

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
      const apiUrl = getApiBaseUrl()
      const loginUrl = `${apiUrl}/auth/login`
      
      console.log('[Login] Attempting login to:', loginUrl)
      console.log('[Login] Email:', email)
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      console.log('[Login] Response status:', response.status)
      console.log('[Login] Response URL:', response.url)

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('[Login] Non-JSON response received:', text.substring(0, 200))
        return { 
          success: false, 
          error: `Server returned ${response.status}. Check if backend is running and API URL is correct.` 
        }
      }

      const data = await response.json()
      console.log('[Login] Response data:', data)

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
        // Show the actual error message from backend
        const errorMsg = data.error || data.message || 'Login failed'
        console.error('[Login] Login failed:', errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch (error) {
      console.error('[Login] Login error:', error)
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

