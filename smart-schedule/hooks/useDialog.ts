import { useState, useCallback } from 'react'

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

export function useDialog() {
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

  const confirm = useCallback((options: Omit<DialogOptions, 'onConfirm' | 'onCancel'>) => {
    return new Promise<boolean>((resolve) => {
      showDialog({
        ...options,
        onConfirm: () => {
          hideDialog()
          resolve(true)
        },
        onCancel: () => {
          hideDialog()
          resolve(false)
        }
      })
    })
  }, [showDialog, hideDialog])

  return {
    dialog,
    showDialog,
    hideDialog,
    confirm
  }
}
