import { Children, isValidElement, type ComponentProps } from 'react'

type SelectProps = Omit<ComponentProps<'select'>, 'multiple' | 'size' | 'value'> & {
  value: string
}

/** Mantiene el selector nativo y muestra su valor completo, con salto de línea. */
export function Select({
  children,
  className = '',
  value,
  disabled,
  ...props
}: SelectProps) {
  const opciones = Children.toArray(children)
  const seleccionada = opciones.find(
    (opcion) =>
      isValidElement<ComponentProps<'option'>>(opcion) &&
      opcion.type === 'option' &&
      String(opcion.props.value) === value,
  )
  const texto = isValidElement<ComponentProps<'option'>>(seleccionada)
    ? seleccionada.props.children
    : 'Seleccionar'

  return (
    <span
      className={`relative block min-h-11 w-full min-w-0 rounded-lg border border-salvia-300 bg-white text-base text-pino-950 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-pino-600 has-disabled:cursor-not-allowed has-disabled:bg-salvia-100 has-disabled:text-salvia-600 sm:text-sm ${className}`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none flex min-h-[calc(2.75rem-2px)] items-center justify-between gap-3 px-3 py-2.5"
      >
        <span className="min-w-0 break-words leading-5">{texto}</span>
        <svg viewBox="0 0 20 20" fill="none" className="size-4 shrink-0" aria-hidden="true">
          <path
            d="m5 7.5 5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <select
        {...props}
        value={value}
        disabled={disabled}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      >
        {children}
      </select>
    </span>
  )
}
