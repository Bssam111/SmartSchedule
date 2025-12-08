'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'

type RoleType = 'student' | 'faculty' | 'committee' | 'admin'
interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: RoleType | RoleType[]
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
      // Backend returns uppercase roles (STUDENT, FACULTY, COMMITTEE)
      const userRole = (user?.role || '').toUpperCase()

      // Map backend roles to frontend roles
      const roleMap: Record<string, string> = {
        'STUDENT': 'STUDENT',
        'FACULTY': 'FACULTY',
        'COMMITTEE': 'COMMITTEE',
        'ADMIN': 'ADMIN',
      }

      const userRoleNormalized = roleMap[userRole] || userRole
      
      // Handle both single role string and array of roles
      const requiredRoles = Array.isArray(requiredRole) 
        ? requiredRole.map(r => r.toUpperCase())
        : [requiredRole.toUpperCase()]
      
      // Admin has access to all routes
      if (userRole === 'ADMIN') {
        // Admin can access any route, so allow it
        return
      }
      
      // Check if user's role is in the list of required roles
      const hasAccess = requiredRoles.includes(userRoleNormalized)
      
      if (!hasAccess) {
        // Redirect to appropriate dashboard based on user's actual role
        if (userRole === 'STUDENT' || userRoleNormalized === 'STUDENT') {
          router.push('/student/dashboard')
        } else if (userRole === 'FACULTY' || userRoleNormalized === 'FACULTY') {
          router.push('/faculty/dashboard')
        } else if (userRole === 'COMMITTEE' || userRoleNormalized === 'COMMITTEE') {
          router.push('/committee/dashboard')
        } else if (userRole === 'ADMIN' || userRoleNormalized === 'ADMIN') {
          router.push('/admin/dashboard')
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
    // Backend returns uppercase roles (STUDENT, FACULTY, COMMITTEE)
    const userRole = (user?.role || '').toUpperCase()
    const roleMap: Record<string, string> = {
      'STUDENT': 'STUDENT',
      'FACULTY': 'FACULTY',
      'COMMITTEE': 'COMMITTEE',
      'ADMIN': 'ADMIN',
    }
    const userRoleNormalized = roleMap[userRole] || userRole

    // Handle both single role string and array of roles
    const requiredRoles = Array.isArray(requiredRole) 
      ? requiredRole.map(r => r.toUpperCase())
      : [requiredRole.toUpperCase()]

    // Admin has access to all routes
    if (userRole === 'ADMIN') {
      return <>{children}</> // Admin can access any route
    }

    // Check if user's role is in the list of required roles
    const hasAccess = requiredRoles.includes(userRoleNormalized)
    
    if (!hasAccess) {
      return null // Will redirect in useEffect
    }
  }

  return <>{children}</>
}




