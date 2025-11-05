'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

interface BackButtonProps {
  readonly fallbackUrl?: string
  readonly className?: string
  readonly children?: React.ReactNode
}

export function BackButton({ 
  fallbackUrl = '/', 
  className = '',
  children 
}: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      router.back()
    } else {
      // Fallback to specified URL or home
      router.push(fallbackUrl)
    }
  }

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1 ${className}`}
      title="Go back"
      aria-label="Go back to previous page"
    >
      <ArrowLeftIcon className="w-4 h-4" />
      {children || 'Back'}
    </button>
  )
}
