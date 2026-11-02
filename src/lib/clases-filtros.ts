/** Columnas iguales que se adaptan al espacio real disponible, incluso con zoom. */
export const BARRA_FILTROS =
  'grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] items-start gap-4 rounded-xl border border-salvia-200 bg-white p-4 shadow-sm sm:p-5 [&>div]:min-w-0'

/** Control base (select, input de texto o fecha). */
export const CONTROL_FILTRO =
  'mt-1.5 block min-h-11 w-full min-w-0 rounded-lg border border-salvia-300 bg-white px-3 py-2.5 text-base leading-5 text-pino-950 placeholder:text-salvia-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600 sm:text-sm'
