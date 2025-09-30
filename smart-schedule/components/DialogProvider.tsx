'use client'
import React, { useState, useCallback, useMemo } from 'react'

interface DialogOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
  type?: 'info' | 'warning' | 'error' | 'success'
}

interface DialogState {
  isOpen: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  onConfirm?: () => void
  onCancel?: () => void
  type: 'info' | 'warning' | 'error' | 'success'
}

interface DialogContextType {
  dialog: DialogState
  showDialog: (options: DialogOptions) => void
  hideDialog: () => void
  confirm: (options: Omit<DialogOptions, 'onConfirm' | 'onCancel'>) => Promise<boolean>
}

const DialogContext = React.createContext<DialogContextType | undefined>(undefined)

export function useDialog() {
  const context = React.useContext(DialogContext)
  if (context === undefined) {
    throw new Error('useDialog must be used within a DialogProvider')
  }
  return context
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    type: 'info'
  })

  const showDialog = useCallback((options: DialogOptions) => {
    console.log('🔔 showDialog called with:', options)
    setDialog({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || 'OK',
      cancelText: options.cancelText || 'Cancel',
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
      type: options.type || 'info'
    })
    console.log('🔔 Dialog state updated')
  }, [])

  const hideDialog = useCallback(() => {
    setDialog(prev => ({ ...prev, isOpen: false }))
  }, [])

  const confirm = useCallback((options: Omit<DialogOptions, 'onConfirm' | 'onCancel'>) => {
    console.log('🔔 useDialog.confirm called with:', options)
    return new Promise<boolean>((resolve) => {
      console.log('🔔 Creating dialog with options:', options)
      showDialog({
        ...options,
        onConfirm: () => {
          console.log('🔔 Dialog confirmed')
          hideDialog()
          resolve(true)
        },
        onCancel: () => {
          console.log('🔔 Dialog cancelled')
          hideDialog()
          resolve(false)
        }
      })
    })
  }, [showDialog, hideDialog])

  const contextValue = useMemo(() => ({
    dialog,
    showDialog,
    hideDialog,
    confirm
  }), [dialog, showDialog, hideDialog, confirm])

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
    </DialogContext.Provider>
  )
}
