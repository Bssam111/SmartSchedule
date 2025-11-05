'use client'
import { useAuth } from './AuthProvider'
import { BackButton } from './BackButton'
import { LogoutButton } from './LogoutButton'

interface AppHeaderProps {
  readonly title: string
  readonly showBack?: boolean
  readonly backFallbackUrl?: string
  readonly className?: string
}

export function AppHeader({ 
  title, 
  showBack = true, 
  backFallbackUrl,
  className = '' 
}: AppHeaderProps) {
  const { authState } = useAuth()

  return (
    <header className={`bg-white shadow-sm border-b ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            {showBack && (
              <BackButton fallbackUrl={backFallbackUrl} />
            )}
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          </div>
          
          {authState.isAuthenticated && (
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {authState.user?.name || 'User'}
              </div>
              <LogoutButton />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
