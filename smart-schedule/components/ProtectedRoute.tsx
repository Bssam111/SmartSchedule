'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'student' | 'faculty' | 'committee'
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { authState, hasRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authState.isLoading) {
      if (!authState.isAuthenticated) {
        router.push(redirectTo)
        return
      }

      if (requiredRole && !hasRole(requiredRole)) {
        // Redirect to appropriate dashboard based on user's actual role
        const user = authState.user
        if (user) {
          if (user.role === 'student') {
            router.push('/student/dashboard')
          } else if (user.role === 'faculty') {
            router.push('/faculty/dashboard')
          } else if (user.role === 'committee') {
            router.push('/committee/dashboard')
          }
        } else {
          router.push(redirectTo)
        }
        return
      }
    }
  }, [authState, requiredRole, redirectTo, router, hasRole])

  // Show loading state while checking authentication
  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Don't render children if not authenticated or wrong role
  if (!authState.isAuthenticated || (requiredRole && !hasRole(requiredRole))) {
    return null
  }

  return <>{children}</>
}
