
import type { operations } from '@/types/api'

/** Actor resuelto por el backend (JOIN a usuarios). */
export type ActorAuditoria = {
  nombre: string
  apellido: string
  email: string
}

export type EventoAuditoria = {
  id: string
  actor_id: string | null
  actor: ActorAuditoria | null
  accion: string
  entidad: string
  entidad_id: string | null
  ip: string | null
  user_agent: string | null
  datos_despues: Record<string, unknown> | null
  created_at: string
}

/**
 * GET /auditoria — filtros de query soportados por el backend.
 * El OpenAPI tipa las query como string; `limite` se tipa number porque
 * el service hace Number(limite) (contrato real, no el mínimo del schema).
 */
export type FiltrosAuditoria = Omit<
  NonNullable<operations['AuditoriaController_listar']['parameters']['query']>,
  'limite'
> & { limite?: number }
