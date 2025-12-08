'use client'
import { useState, useEffect } from 'react'
import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { authenticateWithFingerprint, isWebAuthnSupported } from '@/lib/webauthn'

const featureCards = [
  {
    title: 'Students',
    description: 'Review your schedule, enrollment status, and notifications in one place.',
    accent: 'from-indigo-500/20 to-indigo-300/10'
  },
  {
    title: 'Faculty',
    description: 'Track assignments, room locations, and rosters with real-time updates.',
    accent: 'from-emerald-500/20 to-emerald-300/10'
  },
  {
    title: 'Committee',
    description: 'Create sections, enroll students, and analyze conflicts instantly.',
    accent: 'from-blue-500/20 to-blue-300/10'
  }
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFingerprintLoading, setIsFingerprintLoading] = useState(false)
  const [error, setError] = useState('')
  const [registered, setRegistered] = useState(false)
  const [webauthnSupported, setWebauthnSupported] = useState(false)

  const { login, user: authUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Client-side only checks
    if (typeof globalThis.window !== 'undefined') {
      setWebauthnSupported(isWebAuthnSupported())

      // Check if user just registered
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('registered') === 'true') {
        setRegistered(true)
        // Clear the query parameter
        window.history.replaceState({}, '', '/login')
      }
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔐 Login form submitted')
    setIsLoading(true)
    setError('')

    try {
      console.log('🔐 Calling login with:', { email, password })
      const result = await login(email, password)
      console.log('🔐 Login result:', result)

      if (result.success) {
        console.log('🔐 Login successful, checking for password reset requirement')
        
        // Check if password reset is required (handled by AuthProvider, but check result too)
        if ((result as any).requiresPasswordReset || (result as any).requiresPasswordChange) {
          console.log('🔐 Password reset required, redirecting to reset-password')
          router.push('/reset-password')
          return
        }
        
        console.log('🔐 Login successful, redirecting based on user role')
        
        // Wait a moment for AuthProvider to update, then get user role
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Get the user role from auth context or localStorage (client-side only)
        let userRole = (authUser?.role || '').toUpperCase()
        if (typeof globalThis.window !== 'undefined') {
          try {
            const authState = JSON.parse(localStorage.getItem('smartSchedule_user') || '{}')
            userRole = (authState.role || userRole).toUpperCase()
          } catch {
            // Ignore parse errors
          }
        }

        console.log('🔐 User role:', userRole)
        console.log('🔐 Auth user from context:', authUser)

        // Redirect based on actual user role from backend (uppercase)
        if (userRole === 'STUDENT') {
          console.log('🔐 Redirecting to student dashboard')
          router.push('/student/dashboard')
        } else if (userRole === 'FACULTY') {
          console.log('🔐 Redirecting to faculty dashboard')
          router.push('/faculty/dashboard')
        } else if (userRole === 'COMMITTEE') {
          console.log('🔐 Redirecting to committee dashboard')
          router.push('/committee/dashboard')
        } else if (userRole === 'ADMIN') {
          console.log('🔐 Redirecting to admin dashboard')
          router.push('/admin/dashboard')
        } else {
          console.log('🔐 Unknown role, redirecting to home:', userRole)
          // Fallback to home page
          router.push('/')
        }
      } else {
        console.log('🔐 Login failed:', result.error)
        setError(result.error || 'Login failed')
      }
    } catch (err) {
      console.error('🔐 Login error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFingerprintLogin = async () => {
    if (!email) {
      setError('Please enter your email first')
      return
    }

    setIsFingerprintLoading(true)
    setError('')

    try {
      console.log('🔐 Starting fingerprint authentication for:', email)
      const result = await authenticateWithFingerprint(email)
      console.log('🔐 Fingerprint authentication result:', result)

      if (result.success && result.user) {
        console.log('🔐 Fingerprint authentication successful')
        // Store user in localStorage (client-side only)
        if (typeof globalThis.window !== 'undefined') {
          localStorage.setItem('smartSchedule_user', JSON.stringify(result.user))
          localStorage.setItem('smartSchedule_auth', 'true')
        }

        // Redirect based on role (backend returns uppercase)
        const userRole = result.user.role?.toUpperCase() || ''
        console.log('🔐 Fingerprint login - User role:', userRole)
        if (userRole === 'STUDENT') {
          router.push('/student/dashboard')
        } else if (userRole === 'FACULTY') {
          router.push('/faculty/dashboard')
        } else if (userRole === 'COMMITTEE') {
          router.push('/committee/dashboard')
        } else {
          console.log('🔐 Unknown role from fingerprint, redirecting to home:', userRole)
          router.push('/')
        }
      } else {
        // Show detailed error message
        const errorMsg = result.error || 'Fingerprint authentication failed'
        console.error('🔐 Fingerprint authentication failed:', errorMsg)
        setError(errorMsg)
      }
    } catch (err: any) {
      console.error('🔐 Fingerprint login error:', err)
      const errorMessage = err.message || 'An unexpected error occurred'
      setError(errorMessage.includes('No fingerprint') 
        ? errorMessage 
        : `${errorMessage}. Make sure you have registered a fingerprint first.`)
    } finally {
      setIsFingerprintLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="h-[600px] w-[600px] bg-indigo-500/30 rounded-full blur-3xl absolute -top-40 -left-20" />
        <div className="h-[500px] w-[500px] bg-blue-500/30 rounded-full blur-3xl absolute top-40 right-0" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen">
        <div className="flex-1 px-8 lg:px-16 py-16 flex items-center">
          <div className="max-w-xl mx-auto space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">SmartSchedule</p>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
              Welcome back to the{' '}
              <span className="text-indigo-200">University Scheduling</span> workspace
            </h1>
            <p className="text-slate-200/80">
              Manage your academic journey with the same experience you saw on the new landing page—modern gradients,
              calm typography, and quick access to everything you need.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featureCards.map(card => (
                <div
                  key={card.title}
                  className={`rounded-2xl border border-white/10 bg-gradient-to-br ${card.accent} p-4`}
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-white/70">{card.title}</p>
                  <p className="mt-2 text-sm text-white/90">{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-t-3xl lg:rounded-t-none lg:rounded-l-3xl text-slate-900 shadow-2xl p-8 lg:p-12 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-2">
                <svg className="h-10 w-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h2 className="text-3xl font-bold text-gray-900">Sign in to SmartSchedule</h2>
              </div>
              <p className="text-gray-500">One login for students, faculty, and committee</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1234567@student.ksu.edu.sa"
                />
                <p className="mt-1 text-xs text-gray-500">Format: (ID)@student.ksu.edu.sa or (ID/name)@ksu.edu.sa</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <Link
                    href="/reset-password"
                    className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || isFingerprintLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>

              {webauthnSupported && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-400 uppercase text-[11px] tracking-[0.3em]">
                        Or continue with WebAuthn
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleFingerprintLogin}
                    disabled={isLoading || isFingerprintLoading || !email}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 px-4 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    {isFingerprintLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04c.655-1.18 1.179-2.433 1.554-3.737.136-.503.198-1.05.198-1.594 0-1.345-.538-2.57-1.415-3.464L3 12c0-5 4-9 9-9s9 4 9 9c0 1.657-.672 3.157-1.753 4.25l-.247.247c-.724.724-1.561 1.297-2.469 1.697" />
                        </svg>
                        Sign in with Fingerprint
                      </>
                    )}
                  </button>
                </>
              )}

              {registered && (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
                  Registration successful! Please log in with your new account.
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                  <p className="text-sm text-rose-600">{error}</p>
                  {error.includes('No fingerprint registered') && (
                    <div className="mt-2 text-xs text-rose-500 space-y-1">
                      <p className="font-semibold">How to register a fingerprint:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Log in with email/password first</li>
                        <li>Open Settings from your dashboard</li>
                        <li>Select “Register Fingerprint” and follow the prompts</li>
                      </ol>
                      <p className="mt-2 text-indigo-600">
                        <Link href="/settings" className="underline">
                          Open Settings →
                        </Link>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              Don’t have an account?{' '}
              <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                Create one now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
