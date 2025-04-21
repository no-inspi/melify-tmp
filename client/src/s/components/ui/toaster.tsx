"use client"

import { useToast } from "s/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastTitle,
  ToastProvider,
  ToastViewport,
  ToastDescription,
} from "s/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        ))}
      <ToastViewport />
    </ToastProvider>
  )
}
