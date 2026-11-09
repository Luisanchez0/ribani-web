import { formatFecha } from '@/lib/format'

/** El contrato usa fechas de calendario; no deben desplazarse por la zona horaria. */
export function formatFechaMedicamento(fecha: string): string {
  return formatFecha(`${fecha.slice(0, 10)}T00:00:00`)
}
