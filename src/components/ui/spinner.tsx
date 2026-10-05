type SpinnerSize = 'sm' | 'md' | 'lg'

const tamanos: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-4',
}

type SpinnerProps = {
  size?: SpinnerSize
  label?: string
}

export function Spinner({ size = 'md', label }: SpinnerProps) {
  return (
    <span role="status" aria-live="polite">
      <span
        className={`inline-block animate-spin rounded-full border-solid border-slate-300 border-t-blue-600 ${tamanos[size]}`}
        aria-hidden="true"
      />
      <span className="sr-only">{label ?? 'Cargando…'}</span>
    </span>
  )
}
