/**
 * Contrato de /zonas-seguras (ribani-server/src/zonas-seguras).
 * Los campos llegan en snake_case, igual que en Prisma.
 */

/** Fila de zonas_seguras (ZonaSeguraRespuestaDto). */
export type ZonaSegura = {
  id: string
  adulto_id: string
  nombre: string
  latitud_centro: number
  longitud_centro: number
  radio_metros: number
  notificar_salida: boolean
  notificar_entrada: boolean
  activa: boolean
  created_at: string
  updated_at: string
}

/** POST /zonas-seguras — CreateZonaSeguraDto. */
export type CrearZonaSegura = {
  adulto_id: string
  nombre: string
  latitud_centro: number
  longitud_centro: number
  radio_metros: number
  notificar_salida?: boolean
  notificar_entrada?: boolean
}

/** PATCH /zonas-seguras/{id} — UpdateZonaSeguraDto. */
export type ActualizarZonaSegura = Partial<
  Omit<CrearZonaSegura, 'adulto_id'>
> & {
  /** Solo `true` vía PATCH; para desactivar se usa DELETE (baja lógica). */
  activa?: boolean
}

/** Límites del contrato (create/update-zona-segura.dto.ts). */
export const RADIO_MIN_METROS = 50
export const RADIO_MAX_METROS = 10000
