import type { ComponentProps } from 'react'

export function Input({
  className = '',
  ...props
}: ComponentProps<'input'>) {
  return (
    <input
      className={`min-h-11 w-full min-w-0 rounded-lg border border-salvia-300 bg-white px-3 py-2.5 text-base leading-5 text-pino-950 placeholder:text-salvia-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600 disabled:cursor-not-allowed disabled:bg-salvia-100 sm:text-sm ${className}`}
      {...props}
    />
  )
}
