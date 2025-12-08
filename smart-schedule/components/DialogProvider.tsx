'use client'

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react'

interface DialogOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  variant?: 'danger' | 'warning' | 'info'
}

interface DialogContextType {
  showDialog: (options: DialogOptions) => void
  confirm: (options: Omit<DialogOptions, 'onCancel'>) => Promise<boolean>
  hideDialog: () => void
  dialog: DialogOptions | null
  isOpen: boolean
}

const DialogContext = createContext<DialogContextType | undefined>(undefined)

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogOptions | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const showDialog = useCallback((options: DialogOptions) => {
    setDialog(options)
    setIsOpen(true)
  }, [])

  const hideDialog = useCallback(() => {
    setIsOpen(false)
    setTimeout(() => setDialog(null), 300) // Wait for animation
  }, [])

  const confirm = useCallback((options: Omit<DialogOptions, 'onCancel'>): Promise<boolean> => {
    return new Promise((resolve) => {
      showDialog({
        ...options,
        onConfirm: async () => {
          if (options.onConfirm) {
            await options.onConfirm()
          }
          hideDialog()
          resolve(true)
        },
        onCancel: () => {
          hideDialog()
          resolve(false)
        },
      })
    })
  }, [showDialog, hideDialog])

  const handleConfirm = async () => {
    if (dialog?.onConfirm) {
      await dialog.onConfirm()
    }
    hideDialog()
  }

  const handleCancel = () => {
    if (dialog?.onCancel) {
      dialog.onCancel()
    }
    hideDialog()
  }

  return (
    <DialogContext.Provider value={{ showDialog, confirm, hideDialog, dialog, isOpen }}>
      {children}
      {isOpen && dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in zoom-in-95">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{dialog.title}</h3>
              <p className="text-sm text-gray-600 mb-6">{dialog.message}</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {dialog.cancelText || 'Cancel'}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                    dialog.variant === 'danger'
                      ? 'bg-red-600 hover:bg-red-700'
                      : dialog.variant === 'warning'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {dialog.confirmText || 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const context = useContext(DialogContext)
  if (context === undefined) {
    throw new Error('useDialog must be used within a DialogProvider')
  }
  return context
}




