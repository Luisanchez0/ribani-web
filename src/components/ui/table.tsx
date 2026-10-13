import type { ComponentProps } from 'react'


export function Table({
  className = '',
  children,
  ...props
}: ComponentProps<'table'>) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={`w-full min-w-max text-left text-sm ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

export function Th({ className = '', ...props }: ComponentProps<'th'>) {
  return (
    <th
      scope="col"
      className={`border-b border-salvia-200 px-3 py-2.5 text-xs font-semibold tracking-wide text-salvia-600 ${className}`}
      {...props}
    />
  )
}

export function Td({ className = '', ...props }: ComponentProps<'td'>) {
  return (
    <td
      className={`border-b border-salvia-100 px-3 py-2.5 text-pino-950 ${className}`}
      {...props}
    />
  )
}
