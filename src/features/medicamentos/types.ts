/**
 * Contrato de la feature de medicamentos, tomado de src/types/api.d.ts
 * (generado con openapi-typescript desde ribani-server).
 *
 * El OpenAPI no define schemas de respuesta, así que los tipos de lectura
 * reflejan lo que devuelve el backend (GET /medicamentos y afines con
 * sesión) — campos en snake_case, según Prisma.
 */
import type { components, operations } from '@/types/api'

/** GET /medicamentos y GET /medicamentos/{id} — medicamento del adulto. */
export type Medicamento = {
  id: string
  adulto_id: string
  nombre: string
  descripcion: string | null
  dosis: number
  unidad_dosis: string
  instrucciones: string | null
  fecha_inicio: string
  fecha_fin: string | null
  zona_horaria: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

/** GET /medicamentos/{medicamentoId}/horarios — horario de toma. */
export type Horario = {
  id: string
  medicamento_id: string
  hora_local: string
  dias_semana: number[] | null
  intervalo_minutos: number | null
  ventana_minutos: number | null
  activo: boolean
  created_at: string
  updated_at: string
}

/** GET /tomas — registro de toma de un medicamento. */
export type Toma = {
  id: string
  medicamento_id: string
  horario_id: string | null
  programada_para: string
  estado: 'PENDIENTE' | 'TOMADA' | 'OMITIDA'
  tomada_en: string | null
  dosis_tomada: number | null
  nota: string | null
  created_at: string
  updated_at: string
}

/** GET /medicamentos — filtros de query soportados por el backend. */
export type FiltrosMedicamentos =
  operations['MedicamentosController_findAll']['parameters']['query']

/** GET /medicamentos/{medicamentoId}/horarios — filtros de query. */
export type FiltrosHorarios =
  operations['HorariosController_findAll']['parameters']['query']

/** GET /tomas — filtros de query soportados por el backend. */
export type FiltrosTomas =
  operations['TomasController_findAll']['parameters']['query']

/** POST /medicamentos — body (CreateMedicamentoDto). */
export type CrearMedicamento = components['schemas']['CreateMedicamentoDto']

/** PATCH /medicamentos/{id} — body (UpdateMedicamentoDto). */
export type ActualizarMedicamento =
  components['schemas']['UpdateMedicamentoDto']

/** POST /medicamentos/{medicamentoId}/horarios — body (CreateHorarioDto). */
export type CrearHorario = components['schemas']['CreateHorarioDto']

/** PATCH /medicamentos/{medicamentoId}/horarios/{id} — body. */
export type ActualizarHorario = components['schemas']['UpdateHorarioDto']

/** POST /tomas — body (CreateTomaDto). */
export type CrearToma = components['schemas']['CreateTomaDto']

/** PATCH /tomas/{id} — body (UpdateTomaDto). */
export type ActualizarToma = components['schemas']['UpdateTomaDto']
