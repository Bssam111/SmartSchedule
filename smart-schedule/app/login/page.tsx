'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../components/AuthProvider'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { login } = useAuth()
  const router = useRouter()

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
        console.log('🔐 Login successful, redirecting based on user role')
        // Get the user role from auth state after successful login
        const authState = JSON.parse(localStorage.getItem('smartSchedule_user') || '{}')
        const userRole = authState.role
        
        // Redirect based on actual user role from backend
        if (userRole === 'student') {
          console.log('🔐 Redirecting to student dashboard')
          router.push('/student/dashboard')
        } else if (userRole === 'faculty') {
          console.log('🔐 Redirecting to faculty dashboard')
          router.push('/faculty/dashboard')
        } else if (userRole === 'committee') {
          console.log('🔐 Redirecting to committee dashboard')
          router.push('/committee/dashboard')
        } else {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SmartSchedule</h1>
          <p className="text-gray-600">University Scheduling System</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your.email@university.edu"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
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
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </form>
        
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Demo Login Credentials</h3>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="font-medium">Email</div>
              <div className="font-medium">Password</div>
              <div className="font-medium">Role</div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>student@demo.com</div>
              <div>TestPassword123!</div>
              <div>student</div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>faculty@demo.com</div>
              <div>TestPassword123!</div>
              <div>faculty</div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>committee@demo.com</div>
              <div>TestPassword123!</div>
              <div>committee</div>
            </div>
          </div>
          <div className="mt-3 text-center">
            <Link href="/rbac-test" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Test RBAC Permissions →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}