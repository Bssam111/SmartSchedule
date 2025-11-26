'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'student' | 'faculty' | 'committee'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, authState } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !authState.isAuthenticated) {
      router.push('/login')
      return
    }

    if (!loading && authState.isAuthenticated && requiredRole) {
      const userRole = user?.role?.toLowerCase() || ''
      const normalizedRequiredRole = requiredRole.toLowerCase()

      // Map backend roles to frontend roles
      const roleMap: Record<string, string> = {
        'student': 'student',
        'faculty': 'faculty',
        'committee': 'committee',
      }

      const userRoleNormalized = roleMap[userRole] || userRole
      
      if (userRoleNormalized !== normalizedRequiredRole) {
        // Redirect to appropriate dashboard based on user's actual role
        if (userRole === 'student' || userRoleNormalized === 'student') {
          router.push('/student/dashboard')
        } else if (userRole === 'faculty' || userRoleNormalized === 'faculty') {
          router.push('/faculty/dashboard')
        } else if (userRole === 'committee' || userRoleNormalized === 'committee') {
          router.push('/committee/dashboard')
        } else {
          router.push('/')
        }
      }
    }
  }, [loading, authState.isAuthenticated, user, requiredRole, router])

  if (loading || !authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (requiredRole) {
    const userRole = user?.role?.toLowerCase() || ''
    const normalizedRequiredRole = requiredRole.toLowerCase()
    const roleMap: Record<string, string> = {
      'student': 'student',
      'faculty': 'faculty',
      'committee': 'committee',
    }
    const userRoleNormalized = roleMap[userRole] || userRole

    if (userRoleNormalized !== normalizedRequiredRole) {
      return null // Will redirect in useEffect
    }
  }

  return <>{children}</>
}


