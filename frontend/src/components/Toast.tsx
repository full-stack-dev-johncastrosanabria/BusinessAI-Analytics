import { useEffect } from 'react'
import './Toast.css'

// Configuration constants
const DEFAULT_TOAST_DURATION_MS = 3000 // 3 seconds

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastProps {
  toast: ToastMessage
  onClose: (id: string) => void
}

function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id)
    }, toast.duration || DEFAULT_TOAST_DURATION_MS)

    return () => clearTimeout(timer)
  }, [toast, onClose])

  return (
    <div className={`toast toast-${toast.type}`}>
      <span>{toast.message}</span>
      <button onClick={() => onClose(toast.id)} className="toast-close">
        ×
      </button>
    </div>
  )
}

export default Toast
