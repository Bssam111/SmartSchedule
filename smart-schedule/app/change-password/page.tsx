'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import api from '@/lib/api'

export default function ChangePasswordPage() {
  const router = useRouter()
  const { user, getCurrentUser } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [requiresChange, setRequiresChange] = useState(false)

  useEffect(() => {
    // Check if user requires password change
    const checkRequiresChange = async () => {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL 
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`
          : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
        const response = await fetch(`${apiBaseUrl}/auth/me`, {
          method: 'GET',
          credentials: 'include',
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user?.requiresPasswordChange) {
            setRequiresChange(true)
          }
        } else if (response.status === 401) {
          // If not authenticated, redirect to login
          router.push('/login')
        }
      } catch (err) {
        // If error, still allow access if user is in localStorage
        if (user) {
          // Try to get from user object
          const storedUser = localStorage.getItem('smartSchedule_user')
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser)
              if (parsed.requiresPasswordChange) {
                setRequiresChange(true)
              }
            } catch {
              // Ignore parse errors
            }
          }
        } else {
          router.push('/login')
        }
      }
    }

    if (user) {
      checkRequiresChange()
    } else {
      router.push('/login')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 12) {
      setError('Password must be at least 12 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Basic password strength check
    const hasUpper = /[A-Z]/.test(newPassword)
    const hasLower = /[a-z]/.test(newPassword)
    const hasNumber = /\d/.test(newPassword)
    const hasSpecial = /[!@#$%&*]/.test(newPassword)

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      setError('Password must include uppercase, lowercase, number, and special character (!@#$%&*)')
      return
    }

    setLoading(true)

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL 
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`
        : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${apiBaseUrl}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: requiresChange ? undefined : currentPassword,
          newPassword,
          confirmPassword
        }),
      })

      const data = await response.json()
      
      if (data.success) {

        // Redirect based on user role
        const userRole = user?.role?.toUpperCase()
        if (userRole === 'STUDENT') {
          router.push('/student/dashboard')
        } else if (userRole === 'FACULTY') {
          router.push('/faculty/dashboard')
        } else if (userRole === 'COMMITTEE') {
          router.push('/committee/dashboard')
        } else {
          router.push('/')
        }
      } else {
        setError(data.error || 'Failed to change password')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {requiresChange ? 'Change Your Password' : 'Update Password'}
          </h1>
          {requiresChange && (
            <p className="text-orange-600 font-medium">
              You must change your password before continuing
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!requiresChange && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              minLength={12}
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be at least 12 characters with uppercase, lowercase, number, and special character
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              minLength={12}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

