import type { ComponentProps } from 'react'

export function Card({
  className = '',
  children,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({
  className = '',
  children,
  ...props
}: ComponentProps<'h2'>) {
  return (
    <h2
      className={`text-lg font-semibold text-slate-900 ${className}`}
      {...props}
    >
      {children}
    </h2>
  )
}
