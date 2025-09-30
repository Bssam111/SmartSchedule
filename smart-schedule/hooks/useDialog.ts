import { useState, useCallback, createContext, useContext } from 'react'

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

// Dialog provider will be created in a separate .tsx file
