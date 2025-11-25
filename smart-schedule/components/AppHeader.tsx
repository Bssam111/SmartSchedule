'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from './AuthProvider'

interface AppHeaderProps {
  title: string
  showBack?: boolean
  backFallbackUrl?: string
}

export function AppHeader({ title, showBack = true, backFallbackUrl }: AppHeaderProps) {
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleBack = () => {
    if (backFallbackUrl) {
      router.push(backFallbackUrl)
    } else {
      router.back()
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            {showBack && (
              <button
                onClick={handleBack}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
            {!user && (
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

