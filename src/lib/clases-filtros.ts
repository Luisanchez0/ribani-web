/**
 * Clases compartidas de las barras de filtros.
 *
 * El problema que resuelven: cada sección definía su propio className, así que
 * un <select> sin ancho crecía con el nombre del adulto más largo mientras otros
 * campos eran fijos. Aquí quedan una sola altura, un solo borde y anchos por
 * tipo de dato, iguales en todo el panel.
 */

/** Contenedor de una barra de filtros. */
export const BARRA_FILTROS =
  'flex flex-wrap items-end gap-3 rounded-lg border border-salvia-200 bg-white p-4 shadow-sm'

/** Control base (select, input de texto o fecha). */
export const CONTROL_FILTRO =
  'mt-1 h-9 rounded-md border border-salvia-300 bg-white px-3 text-sm text-pino-950 placeholder:text-salvia-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600'

/** Anchos fijos por tipo de dato. */
export const ANCHO_CORTO = 'w-40'
export const ANCHO_NORMAL = 'w-56'
export const ANCHO_LARGO = 'w-72'
