'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { getApiBaseUrlForBrowser } from '@/lib/api-utils'
import { useToast, ToastContainer } from '@/components/Toast'

interface PasswordRequirements {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
}

type Step = 'email' | 'verify' | 'reset'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toasts, removeToast } = useToast()
  
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [requirements, setRequirements] = useState<PasswordRequirements | null>(null)
  const [requiresReset, setRequiresReset] = useState(false)

  useEffect(() => {
    // Load password requirements
    const loadRequirements = async () => {
      try {
        const apiUrl = getApiBaseUrlForBrowser()
        const response = await fetch(`${apiUrl}/password-requirements`, {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setRequirements(data.data)
          }
        }
      } catch (err) {
        console.error('Error loading password requirements:', err)
      }
    }

    loadRequirements()

    // Check if user requires password reset (first login with temp password)
    const checkRequiresReset = async () => {
      try {
        const apiUrl = getApiBaseUrlForBrowser()
        const response = await fetch(`${apiUrl}/auth/me`, {
          method: 'GET',
          credentials: 'include',
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user?.requiresPasswordChange) {
            setRequiresReset(true)
            setStep('reset') // Skip email/OTP for authenticated users
            if (data.user?.email) {
              setEmail(data.user.email)
            }
          }
        } else if (response.status === 401) {
          // Not authenticated - this is a forgot password flow
          setStep('email')
        }
      } catch (err) {
        // Check localStorage for user
        const storedUser = localStorage.getItem('smartSchedule_user')
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser)
            if (parsed.requiresPasswordChange) {
              setRequiresReset(true)
              setStep('reset')
              if (parsed.email) {
                setEmail(parsed.email)
              }
            } else {
              setStep('email')
            }
          } catch {
            setStep('email')
          }
        } else {
          setStep('email')
        }
      }
    }

    checkRequiresReset()
  }, [user])

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const apiUrl = getApiBaseUrlForBrowser()
      const response = await fetch(`${apiUrl}/otp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setStep('verify')
      } else {
        setError(data.error || 'Failed to send verification code')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const apiUrl = getApiBaseUrlForBrowser()
      const response = await fetch(`${apiUrl}/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, code: otpCode })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setStep('reset')
      } else {
        setError(data.error || 'Invalid verification code')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const apiUrl = getApiBaseUrlForBrowser()
      
      // If authenticated (requiresReset), use change-password endpoint
      if (requiresReset) {
        const response = await fetch(`${apiUrl}/auth/change-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            newPassword,
            confirmPassword
          }),
        })

      const data = await response.json()
      
      if (data.success) {
        // Update user in localStorage
        const storedUser = localStorage.getItem('smartSchedule_user')
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser)
            parsed.requiresPasswordChange = false
            localStorage.setItem('smartSchedule_user', JSON.stringify(parsed))
          } catch {
            // Ignore parse errors
          }
        }

        // Redirect based on user role
        const currentUser = user || (storedUser ? JSON.parse(storedUser) : null)
        const userRole = currentUser?.role?.toUpperCase()
        if (userRole === 'STUDENT') {
          router.push('/student/dashboard')
        } else if (userRole === 'FACULTY') {
          router.push('/faculty/dashboard')
        } else if (userRole === 'COMMITTEE') {
          router.push('/committee/dashboard')
        } else {
          router.push('/login')
        }
      } else {
        // Extract error message from response
        let errorMessage = 'Failed to reset password'
        if (data.error) {
          errorMessage = data.error
        } else if (data.message) {
          errorMessage = data.message
        } else if (data.issues && Array.isArray(data.issues)) {
          // Handle Zod validation errors
          errorMessage = data.issues.map((issue: any) => issue.message || issue).join('. ')
        } else if (typeof data === 'string') {
          errorMessage = data
        }
        setError(errorMessage)
      }
      } else {
        // Forgot password flow - use reset-password endpoint with OTP
        const response = await fetch(`${apiUrl}/auth/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email,
            code: otpCode,
            newPassword
          }),
        })

        const data = await response.json()
        
        if (data.success) {
          router.push('/login?passwordReset=true')
        } else {
          // Extract error message - handle various formats
          let errorMessage = 'Failed to reset password'
          if (data.error) {
            // If error is a string, use it directly
            if (typeof data.error === 'string') {
              errorMessage = data.error
            } else if (typeof data.error === 'object') {
              // If error is an object, try to extract message
              errorMessage = data.error.message || JSON.stringify(data.error)
            }
          } else if (data.message) {
            errorMessage = data.message
          } else if (data.issues && Array.isArray(data.issues)) {
            // Handle Zod validation errors
            errorMessage = data.issues.map((issue: any) => {
              if (typeof issue === 'string') return issue
              return issue.message || JSON.stringify(issue)
            }).join('. ')
          }
          setError(errorMessage)
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getPasswordRequirementsText = (): string => {
    if (!requirements) {
      return 'Loading password requirements...'
    }

    const parts: string[] = []
    parts.push(`at least ${requirements.minLength} characters`)

    if (requirements.requireUppercase) {
      parts.push('uppercase letter')
    }

    if (requirements.requireLowercase) {
      parts.push('lowercase letter')
    }

    if (requirements.requireNumbers) {
      parts.push('number')
    }

    if (requirements.requireSpecialChars) {
      parts.push('special character (!@#$%&*)')
    }

    if (parts.length === 1) {
      return `Password must be ${parts[0]}`
    }

    const lastPart = parts.pop()
    return `Password must be ${parts.join(', ')}, and ${lastPart}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 'email' ? 'Forgot Password?' : step === 'verify' ? 'Verify Email' : 'Reset Your Password'}
          </h1>
          <p className="text-gray-600">
            {step === 'email' 
              ? 'Enter your email address and we\'ll send you a verification code.'
              : step === 'verify'
              ? 'Enter the 6-digit code sent to your email.'
              : requiresReset
              ? 'You\'re logging in with a temporary password. Please set a new password to continue.'
              : 'Enter your new password below.'}
          </p>
        </div>

        {step === 'email' && (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                required
                placeholder="Enter your email"
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
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-center text-2xl tracking-widest font-mono"
                required
                maxLength={6}
                placeholder="000000"
              />
              <p className="text-xs text-gray-500 mt-2">
                Enter the 6-digit code sent to {email}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <div className="text-center space-x-4">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Change Email
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={handleSendOTP}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Resend Code
              </button>
            </div>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                required
                minLength={requirements?.minLength || 8}
                placeholder="Enter your new password"
              />
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">Password Requirements:</p>
                <p className="text-xs text-blue-700">{getPasswordRequirementsText()}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                required
                minLength={requirements?.minLength || 8}
                placeholder="Confirm your new password"
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
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
