'use client'

import { useCallback } from 'react'

interface ToastOptions {
  duration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export function useToast() {
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info', options?: ToastOptions) => {
    // Create toast element
    const toast = document.createElement('div')
    const position = options?.position || 'top-right'
    const duration = options?.duration || 3000

    // Position classes
    const positionClasses = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
    }

    // Color classes
    const colorClasses = {
      success: 'bg-green-500 text-white',
      error: 'bg-red-500 text-white',
      warning: 'bg-amber-500 text-white',
      info: 'bg-blue-500 text-white',
    }

    toast.className = `fixed ${positionClasses[position]} z-50 px-4 py-3 rounded-lg shadow-lg ${colorClasses[type]} animate-in fade-in slide-in-from-top-2`
    toast.textContent = message

    // Add to DOM
    document.body.appendChild(toast)

    // Remove after duration
    setTimeout(() => {
      toast.classList.add('animate-out', 'fade-out', 'slide-out-to-top-2')
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
        }
      }, 300)
    }, duration)
  }, [])

  const success = useCallback((message: string, options?: ToastOptions) => {
    showToast(message, 'success', options)
  }, [showToast])

  const error = useCallback((message: string, options?: ToastOptions) => {
    showToast(message, 'error', options)
  }, [showToast])

  const warning = useCallback((message: string, options?: ToastOptions) => {
    showToast(message, 'warning', options)
  }, [showToast])

  const info = useCallback((message: string, options?: ToastOptions) => {
    showToast(message, 'info', options)
  }, [showToast])

  return { success, error, warning, info }
}


