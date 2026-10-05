import type { ComponentProps } from 'react'

type AlertVariant = 'error' | 'info' | 'success'

const variantes: Record<AlertVariant, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
}

type AlertProps = ComponentProps<'div'> & {
  variant?: AlertVariant
}

export function Alert({
  variant = 'info',
  className = '',
  children,
  ...props
}: AlertProps) {
  return (
    <div
      role="alert"
      className={`rounded-md border px-4 py-3 text-sm ${variantes[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
