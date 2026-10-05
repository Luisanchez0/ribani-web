import type { ComponentProps } from 'react'

export function Input({
  className = '',
  ...props
}: ComponentProps<'input'>) {
  return (
    <input
      className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-100 ${className}`}
      {...props}
    />
  )
}
