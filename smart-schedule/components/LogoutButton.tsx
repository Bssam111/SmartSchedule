'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { useToast } from '../hooks/useToast'
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'

interface LogoutButtonProps {
  readonly className?: string
  readonly children?: React.ReactNode
  readonly showIcon?: boolean
}

export function LogoutButton({ 
  className = '',
  children,
  showIcon = true 
}: LogoutButtonProps) {
  const { logout } = useAuth()
  const { success } = useToast()
  const router = useRouter()

  const handleLogout = () => {
    try {
      // Clear auth tokens/cookies
      logout()
      
      // Show success message
      success('You\'ve been logged out.')
      
      // Redirect to login page
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Still redirect even if there's an error
      router.push('/login')
    }
  }

  return (
    <button
      onClick={handleLogout}
      className={`inline-flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md px-3 py-2 ${className}`}
      title="Log out"
      aria-label="Log out of your account"
    >
      {showIcon && <ArrowRightOnRectangleIcon className="w-4 h-4" />}
      {children || 'Log out'}
    </button>
  )
}
