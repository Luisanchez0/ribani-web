/**
 * Helpers de formato compartidos.
 * Los textos de UI van en español; los helpers técnicos en inglés.
 */

const formatoFecha = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
})

const formatoHora = new Intl.DateTimeFormat('es-MX', {
  hour: '2-digit',
  minute: '2-digit',
})

type FechaInput = string | number | Date

function aFecha(valor: FechaInput): Date {
  return valor instanceof Date ? valor : new Date(valor)
}

export function formatFecha(valor: FechaInput): string {
  return formatoFecha.format(aFecha(valor))
}

export function formatHora(valor: FechaInput): string {
  return formatoHora.format(aFecha(valor))
}

export function formatFechaHora(valor: FechaInput): string {
  const fecha = aFecha(valor)

  return `${formatoFecha.format(fecha)} ${formatoHora.format(fecha)}`
}

/**
 * Indica si una coordenada es válida para renderizar en el mapa.
 * Nunca asumir que siempre existe una coordenada válida (ver AGENTS.md).
 * Se excluye (0, 0) por ser la convención habitual de "sin ubicación".
 */
export function esCoordenadaValida(
  latitud: number,
  longitud: number,
): boolean {
  return (
    Number.isFinite(latitud) &&
    Number.isFinite(longitud) &&
    latitud >= -90 &&
    latitud <= 90 &&
    longitud >= -180 &&
    longitud <= 180 &&
    !(latitud === 0 && longitud === 0)
  )
}
