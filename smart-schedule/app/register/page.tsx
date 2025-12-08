'use client'
import { useState, useEffect } from 'react'
import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

interface Major {
  id: string
  name: string
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [desiredRole, setDesiredRole] = useState<'STUDENT'>('STUDENT')
  const [majorId, setMajorId] = useState('')
  const [reason, setReason] = useState('')
  const [majors, setMajors] = useState<Major[]>([])
  const [majorsLoading, setMajorsLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  // Email verification state
  const [emailVerified, setEmailVerified] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [sendingOTP, setSendingOTP] = useState(false)
  const [verifyingOTP, setVerifyingOTP] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [otpSuccess, setOtpSuccess] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [canResend, setCanResend] = useState(true)

  useEffect(() => {
    // Load majors
    const loadMajors = async () => {
      setMajorsLoading(true)
      try {
        console.log('Loading majors...')
        const response = await api.getMajors()
        console.log('Majors API response:', response)
        
        if (response.success && response.data) {
          // Backend returns { success: true, data: [...] }
          // API client extracts data, so response.data should be the array
          const majorsData = response.data
          if (Array.isArray(majorsData)) {
            console.log('Setting majors:', majorsData)
            setMajors(majorsData)
          } else {
            console.warn('Majors data is not an array:', majorsData)
            setMajors([])
          }
        } else {
          console.error('Failed to load majors:', response.error)
          setMajors([])
        }
      } catch (error) {
        console.error('Error loading majors:', error)
        setMajors([])
      } finally {
        setMajorsLoading(false)
      }
    }
    
    loadMajors()

    // Check if email is already verified
    const checkEmailVerification = async () => {
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        const statusResponse = await api.checkOTPStatus(email)
        if (statusResponse.success && statusResponse.data?.verified) {
          setEmailVerified(true)
          setOtpSuccess(true)
        }
      }
    }

    if (email) {
      checkEmailVerification()
    }
  }, [email])

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [cooldownSeconds])

  const handleSendOTP = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setOtpError('Please enter a valid email address')
      return
    }

    setSendingOTP(true)
    setOtpError('')
    setOtpSuccess(false)
    setEmailVerified(false)

    try {
      const response = await api.sendOTP(email)
      if (response.success) {
        setOtpSuccess(true)
        setCooldownSeconds(60)
        setCanResend(false)
      } else {
        setOtpError(response.error || 'Failed to send verification code')
      }
    } catch (err) {
      setOtpError('An unexpected error occurred. Please try again.')
    } finally {
      setSendingOTP(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setOtpError('Please enter the 6-digit code')
      return
    }

    setVerifyingOTP(true)
    setOtpError('')

    try {
      const response = await api.verifyOTP(email, otpCode)
      if (response.success) {
        setEmailVerified(true)
        setOtpSuccess(true)
        setOtpError('')
      } else {
        setOtpError(response.error || 'Invalid verification code')
      }
    } catch (err) {
      setOtpError('An unexpected error occurred. Please try again.')
    } finally {
      setVerifyingOTP(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess(false)

    if (!emailVerified) {
      setError('Please verify your email address first')
      setIsLoading(false)
      return
    }

    if (!fullName.trim()) {
      setError('Full name is required')
      setIsLoading(false)
      return
    }

    if (!majorId) {
      setError('Please select a major')
      setIsLoading(false)
      return
    }

    try {
      const response = await api.submitAccessRequest({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        desiredRole,
        majorId,
        reason: reason.trim() || undefined
      })

      if (response.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setError(response.error || 'Failed to submit request')
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = emailVerified && fullName.trim() && majorId && desiredRole

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
              Request Access to{' '}
              <span className="text-indigo-200">SmartSchedule</span>
            </h1>
            <p className="text-slate-200/80">
              Submit a request to join SmartSchedule as a Student. 
              Our admin team will review your request and notify you via email once a decision is made.
            </p>
            <div className="grid grid-cols-1 gap-4">
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/20 to-indigo-300/10 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/70">Students</p>
                <p className="mt-2 text-sm text-white/90">
                  Access your schedule, enroll in courses, and track your academic progress.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-t-3xl lg:rounded-t-none lg:rounded-l-3xl text-slate-900 shadow-2xl p-8 lg:p-12 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-2">
                <svg className="h-10 w-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <h2 className="text-3xl font-bold text-gray-900">Request Access</h2>
              </div>
              <p className="text-gray-500">Fill out the form below to request an account</p>
            </div>

            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-emerald-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Request Submitted Successfully!</p>
                    <p className="text-sm text-emerald-700 mt-1">
                      Your request has been received. We'll email you after the review.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg">
                <p className="text-sm text-rose-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Verification Section */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Email Verification</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setEmailVerified(false)
                        setOtpSuccess(false)
                      }}
                      disabled={emailVerified}
                      className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        emailVerified ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      placeholder="john.doe@example.com"
                      required
                    />
                    {emailVerified && (
                      <div className="flex items-center px-4 bg-green-100 text-green-700 rounded-lg">
                        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Verified
                      </div>
                    )}
                  </div>
                  {!emailVerified && (
                    <p className="mt-1 text-xs text-gray-500">
                      We'll send a verification code to this email address
                    </p>
                  )}
                </div>

                {!emailVerified && (
                  <>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={sendingOTP || !email || !canResend}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
                      >
                        {sendingOTP ? (
                          <>
                            <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Sending...
                          </>
                        ) : (
                          'Send Code'
                        )}
                      </button>
                      {cooldownSeconds > 0 && (
                        <div className="flex items-center px-4 text-sm text-gray-600">
                          Resend in {cooldownSeconds}s
                        </div>
                      )}
                    </div>

                    {otpSuccess && !emailVerified && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Enter Verification Code
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={otpCode}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                              setOtpCode(value)
                              setOtpError('')
                            }}
                            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-xl tracking-widest"
                            placeholder="000000"
                            maxLength={6}
                          />
                          <button
                            type="button"
                            onClick={handleVerifyOTP}
                            disabled={verifyingOTP || otpCode.length !== 6}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            {verifyingOTP ? 'Verifying...' : 'Verify'}
                          </button>
                        </div>
                      </div>
                    )}

                    {otpError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                        {otpError}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <input
                type="hidden"
                value={desiredRole}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Major <span className="text-rose-500">*</span>
                </label>
                <select
                  value={majorId}
                  onChange={(e) => setMajorId(e.target.value)}
                  required
                  disabled={majorsLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">{majorsLoading ? 'Loading...' : 'Select a major'}</option>
                  {majors.map((major) => (
                    <option key={major.id} value={major.id}>
                      {major.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Tell us why you need access to SmartSchedule..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  {reason.length}/1000 characters
                </p>
              </div>

              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
