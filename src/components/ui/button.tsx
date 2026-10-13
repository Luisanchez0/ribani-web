import type { ComponentProps } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger'
type ButtonSize = 'sm' | 'md'

const variantes: Record<ButtonVariant, string> = {
  primary:
    'bg-pino-600 text-white hover:bg-pino-700 focus-visible:outline-pino-600',
  secondary:
    'border border-salvia-300 bg-white text-pino-900 hover:bg-salvia-100 focus-visible:outline-pino-600',
  danger:
    'bg-red-700 text-white hover:bg-red-800 focus-visible:outline-red-700',
}

const tamanos: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
}

type ButtonProps = ComponentProps<'button'> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantes[variant]} ${tamanos[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
