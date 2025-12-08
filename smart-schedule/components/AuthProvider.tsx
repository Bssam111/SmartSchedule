'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react'
import { getApiBaseUrl } from '@/lib/api-utils'

interface User {
  id: string
  email: string
  name: string
  role: string
  universityId?: string
  requiresPasswordChange?: boolean
  major?: {
    id: string
    name: string
    code: string
  } | null
  registrationSemester?: {
    id: string
    name: string
    academicYear: string
    semesterNumber: number
  } | null
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

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored user on mount (client-side only)
    if (typeof globalThis.window !== 'undefined') {
      const storedUser = localStorage.getItem('smartSchedule_user')
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (error) {
          console.error('Error parsing stored user:', error)
          localStorage.removeItem('smartSchedule_user')
        }
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      // Use environment-aware API URL function
      const { getApiBaseUrlForBrowser } = await import('@/lib/api-utils')
      const apiUrl = globalThis.window !== undefined
        ? getApiBaseUrlForBrowser()
        : getApiBaseUrl()
      const baseUrl = apiUrl.replace('/api', '')
      
      // Log the URLs being used for debugging
      console.log('[Login] Environment check:', {
        hasWindow: globalThis.window !== undefined,
        apiUrl,
        baseUrl,
        envApiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
        envApiUrl: process.env.NEXT_PUBLIC_API_URL,
      })
      
      // Health check with better error handling (non-blocking - we'll try login anyway)
      // This is just a pre-check, if it fails we'll still attempt login
      try {
        const healthCheckController = new AbortController()
        const timeoutId = setTimeout(() => healthCheckController.abort(), 3000) // 3 second timeout
        
        const healthCheck = await fetch(`${baseUrl}/healthz`, {
          method: 'GET',
          credentials: 'include',
          signal: healthCheckController.signal,
        })
        clearTimeout(timeoutId)
        
        if (!healthCheck.ok) {
          console.warn('[Login] Health check returned non-OK status:', healthCheck.status, healthCheck.statusText)
          // Don't fail here - let login attempt proceed
        } else {
          console.log('[Login] ✅ Health check passed')
        }
      } catch (healthError) {
        // Health check failed, but don't block login - backend might still be accessible
        const errorMessage = healthError instanceof Error ? healthError.message : 'Unknown error'
        console.warn('[Login] ⚠️ Health check failed (will still attempt login):', errorMessage, 'Base URL:', baseUrl)
        // Continue to login attempt - the actual login will show the real error if backend is down
      }
      
      const loginUrl = `${apiUrl}/auth/login`
      
      console.log('[Login] Attempting login to:', loginUrl)
      console.log('[Login] Email:', email)
      console.log('[Login] API URL verified:', apiUrl)
      console.log('[Login] Base URL:', baseUrl)
      
      let response: Response
      try {
        response = await fetch(loginUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        })
      } catch (fetchError) {
        // Handle network errors (CORS, connection refused, etc.)
        const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error'
        console.error('[Login] Fetch error:', errorMessage)
        console.error('[Login] URL attempted:', loginUrl)
        console.error('[Login] Base URL:', baseUrl)
        
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          // Check if backend is accessible by trying a simple test
          const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
          const backendUrl = apiUrl.replace('/api', '')
          const diagnosticInfo = `\n\n🔍 Diagnostic Steps:\n` +
            `1. Check backend URL: ${backendUrl}\n` +
            `2. Open ${backendUrl}/healthz in your browser\n` +
            `3. Verify NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_API_URL is set correctly\n` +
            `4. If using Docker locally: docker logs smartschedule-backend-dev\n` +
            `5. If using Railway: Check Railway dashboard for backend service status\n\n` +
            `📋 See BACKEND_CONNECTION_TROUBLESHOOTING.md for detailed help.`
          
          return {
            success: false,
            error: `❌ Cannot connect to backend server at ${baseUrl}${diagnosticInfo}`
          }
        }
        
        return {
          success: false,
          error: `Network error: ${errorMessage}\n\nURL attempted: ${loginUrl}`
        }
      }

      console.log('[Login] Response status:', response.status)
      console.log('[Login] Response URL:', response.url)

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
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
          requiresPasswordChange: data.requiresPasswordChange || data.user?.requiresPasswordChange || false,
        }

        setUser(userData)
        if (typeof globalThis.window !== 'undefined') {
          localStorage.setItem('smartSchedule_user', JSON.stringify(userData))
          localStorage.setItem('smartSchedule_auth', 'true')
          // Store token for Authorization header (backup to cookies)
          if (data.token) {
            localStorage.setItem('smartSchedule_token', data.token)
            console.log('[Login] ✅ Token stored in localStorage')
          } else {
            console.warn('[Login] ⚠️ No token in login response!')
          }
        }

        // Check if password change/reset is required
        // Check both the response data and userData for the flag
        const needsPasswordReset = data.requiresPasswordChange || 
                                  data.requiresPasswordReset || 
                                  userData.requiresPasswordChange ||
                                  data.user?.requiresPasswordChange

        if (needsPasswordReset) {
          console.log('[Login] 🔄 Password reset required, redirecting to /reset-password')
          if (typeof globalThis.window !== 'undefined') {
            // Use setTimeout to ensure state is updated before redirect
            setTimeout(() => {
              window.location.href = '/reset-password'
            }, 100)
          }
          return { 
            success: true, 
            requiresPasswordChange: true, 
            requiresPasswordReset: true 
          }
        }

        return { success: true }
      } else {
        // Show the actual error message from backend
        const errorMsg = data.error || data.message || 'Login failed'
        console.error('[Login] Login failed:', errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch (error) {
      console.error('[Login] Login error:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      
      // Provide helpful error messages
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        return {
          success: false,
          error: `Cannot connect to backend server. Please check your NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_API_URL environment variable.`
        }
      }
      
      return { 
        success: false, 
        error: errorMessage
      }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      // Call backend logout to clear cookies
      const apiUrl = getApiBaseUrl()
      await fetch(`${apiUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {
        // Ignore errors - we'll clear local state anyway
      })
    } catch {
      // Ignore errors
    } finally {
      // Always clear local state (client-side only)
      setUser(null)
      if (typeof globalThis.window !== 'undefined') {
        localStorage.removeItem('smartSchedule_user')
        localStorage.removeItem('smartSchedule_auth')
        localStorage.removeItem('smartSchedule_token')
      }
    }
  }, [])

  const getCurrentUser = useCallback(() => {
    return user
  }, [user])

  const authState: AuthState = useMemo(
    () => ({
      isLoading: loading,
      isAuthenticated: !!user,
    }),
    [loading, user]
  )

  const contextValue = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isAuthenticated: !!user,
      getCurrentUser,
      authState,
    }),
    [user, loading, login, logout, getCurrentUser, authState]
  )

  return (
    <AuthContext.Provider
      value={contextValue}
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

