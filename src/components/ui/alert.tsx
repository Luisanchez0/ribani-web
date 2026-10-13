import type { ComponentProps } from 'react'

type AlertVariant = 'error' | 'info' | 'success'

const variantes: Record<AlertVariant, string> = {
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-pino-200 bg-pino-50 text-pino-900',
  success: 'border-pino-300 bg-pino-100 text-pino-900',
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
