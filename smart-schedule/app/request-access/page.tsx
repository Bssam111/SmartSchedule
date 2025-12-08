'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

interface Major {
  id: string
  name: string
}

export default function RequestAccessPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [desiredRole, setDesiredRole] = useState<'STUDENT' | 'FACULTY'>('STUDENT')
  const [majorId, setMajorId] = useState('')
  const [reason, setReason] = useState('')
  const [majors, setMajors] = useState<Major[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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
    api.getMajors().then((response) => {
      if (response.success && response.data) {
        setMajors(Array.isArray(response.data) ? response.data : [])
      }
    })

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
    setError('')
    setSuccess(false)

    if (!emailVerified) {
      setError('Please verify your email address first')
      return
    }

    if (!fullName.trim()) {
      setError('Full name is required')
      return
    }

    if (!majorId) {
      setError('Please select a major')
      return
    }

    setLoading(true)

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
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = emailVerified && fullName.trim() && majorId && desiredRole

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Request Access</h1>
          <p className="text-gray-600">Request access to SmartSchedule as a Student or Faculty member</p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <svg className="h-12 w-12 text-green-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h2 className="text-xl font-semibold text-green-900 mb-2">Request Submitted Successfully!</h2>
            <p className="text-green-700 mb-4">
              Your access request has been received. An administrator will review it shortly.
            </p>
            <p className="text-sm text-green-600">Redirecting to login page...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Verification Section */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Email Verification</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
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
                    className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      emailVerified ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    placeholder="your.email@example.com"
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
              </div>

              {!emailVerified && (
                <>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={sendingOTP || !email || !canResend}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
                          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                          placeholder="000000"
                          maxLength={6}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOTP}
                          disabled={verifyingOTP || otpCode.length !== 6}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Form Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Desired Role <span className="text-red-500">*</span>
              </label>
              <select
                value={desiredRole}
                onChange={(e) => setDesiredRole(e.target.value as 'STUDENT' | 'FACULTY')}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="STUDENT">Student</option>
                <option value="FACULTY">Faculty</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Major <span className="text-red-500">*</span>
              </label>
              <select
                value={majorId}
                onChange={(e) => setMajorId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a major</option>
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
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell us why you need access..."
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <Link
                href="/login"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={!isFormValid || loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Already have an account? <Link href="/login" className="text-blue-600 hover:text-blue-700">Sign in</Link></p>
        </div>
      </div>
    </div>
  )
}

