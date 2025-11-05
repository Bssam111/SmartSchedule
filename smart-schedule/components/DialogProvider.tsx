'use client'
import { useState, useCallback, createContext, useContext, ReactNode, useMemo } from 'react'

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

const DialogContext = createContext<DialogContextType | undefined>(undefined)

export function useDialog() {
  const context = useContext(DialogContext)
  if (context === undefined) {
    throw new Error('useDialog must be used within a DialogProvider')
  }
  return context
}

interface DialogProviderProps {
  readonly children: ReactNode
}

export function DialogProvider({ children }: DialogProviderProps) {
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    type: 'info'
  })

  const showDialog = useCallback((options: DialogOptions) => {
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
  }, [])

  const hideDialog = useCallback(() => {
    setDialog(prev => ({ ...prev, isOpen: false }))
  }, [])

  const confirm = useCallback((options: Omit<DialogOptions, 'onConfirm' | 'onCancel'>): Promise<boolean> => {
    return new Promise((resolve) => {
      showDialog({
        ...options,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      })
    })
  }, [showDialog])

  const value: DialogContextType = useMemo(() => ({
    dialog,
    showDialog,
    hideDialog,
    confirm
  }), [dialog, showDialog, hideDialog, confirm])

  return (
    <DialogContext.Provider value={value}>
      {children}
    </DialogContext.Provider>
  )
}