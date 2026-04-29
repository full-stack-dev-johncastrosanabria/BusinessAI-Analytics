import React, { useState, useCallback } from 'react'
import Toast, { ToastMessage, ToastType } from './Toast'
import './ToastContainer.css'

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void
}

export const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((message: string, type: ToastType, duration?: number) => {
    const id = Date.now().toString()
    const newToast: ToastMessage = { id, message, type, duration }
    setToasts((prev) => [...prev, newToast])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export default ToastContainer
