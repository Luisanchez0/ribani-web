/**
 * Contrato de la feature de ubicaciones, tomado de src/types/api.d.ts
 * (generado con openapi-typescript desde ribani-server).
 */
import type { components, operations } from '@/types/api'

/*
 * El OpenAPI no define schemas de respuesta, así que los tipos de lectura
 * reflejan lo que devuelve el backend en runtime — campos en snake_case,
 * según Prisma. `id` es un BigInt serializado a string por el service.
 */

/** GET /ubicaciones/actual y GET /ubicaciones/historial — reporte individual. */
export type Ubicacion = {
  id: string
  adulto_id: string
  dispositivo_id: string | null
  latitud: number
  longitud: number
  precision_metros: number | null
  altitud_metros: number | null
  /** Fuente del reporte: GPS (android), RED o MANUAL. */
  fuente: 'GPS' | 'RED' | 'MANUAL'
  /** ISO 8601 con zona. */
  registrada_en: string
}

/**
 * GET /ubicaciones/ultimas — última ubicación de cada adulto activo.
 * Solo administrador; una fila por adulto que ya reportó alguna vez.
 */
export type UbicacionResumenAdulto = {
  adulto_id: string
  nombre: string
  apellido: string
  latitud: number
  longitud: number
  precision_metros: number | null
  fuente: 'GPS' | 'RED' | 'MANUAL' | 'OTRA'
  registrada_en: string
}

/** POST /ubicaciones — body (CreateUbicacionDto). */
export type RegistrarUbicacion =
  components['schemas']['CreateUbicacionDto']

/** GET /ubicaciones/historial — parámetros query soportados por el backend. */
export type FiltrosHistorial =
  operations['UbicacionesController_historial']['parameters']['query']

/** Evento `data` del stream SSE /ubicaciones/stream (JSON serializado). */
export type EventoUbicacion = Ubicacion
