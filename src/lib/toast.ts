import { toast as sonnerToast } from 'sonner'

type ToastOptions = {
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  cancel?: {
    label: string
    onClick?: () => void
  }
}

/**
 * Show a success toast notification
 */
export function toastSuccess(message: string, options?: ToastOptions) {
  return sonnerToast.success(message, {
    description: options?.description,
    duration: options?.duration,
    action: options?.action,
    cancel: options?.cancel,
  })
}

/**
 * Show an error toast notification
 */
export function toastError(message: string, options?: ToastOptions) {
  return sonnerToast.error(message, {
    description: options?.description,
    duration: options?.duration,
    action: options?.action,
    cancel: options?.cancel,
  })
}

/**
 * Show an info toast notification
 */
export function toastInfo(message: string, options?: ToastOptions) {
  return sonnerToast.info(message, {
    description: options?.description,
    duration: options?.duration,
    action: options?.action,
    cancel: options?.cancel,
  })
}

/**
 * Show a warning toast notification
 */
export function toastWarning(message: string, options?: ToastOptions) {
  return sonnerToast.warning(message, {
    description: options?.description,
    duration: options?.duration,
    action: options?.action,
    cancel: options?.cancel,
  })
}

/**
 * Show a default toast notification
 */
export function toast(message: string, options?: ToastOptions) {
  return sonnerToast(message, {
    description: options?.description,
    duration: options?.duration,
    action: options?.action,
    cancel: options?.cancel,
  })
}

/**
 * Export the underlying toast function for advanced usage
 */
export { sonnerToast as toastAdvanced }
