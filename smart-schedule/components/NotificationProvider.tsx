'use client'
import { Dialog } from './Dialog'
import { Toast } from './Toast'
import { useState, useEffect } from 'react'

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null
  }

  return (
    <>
      {children}
      <Dialog />
      <Toast />
    </>
  )
}
