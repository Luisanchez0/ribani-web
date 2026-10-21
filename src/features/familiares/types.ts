/**
 * Contrato de la feature de familiares, tomado de src/types/api.d.ts
 * (generado con openapi-typescript desde ribani-server).
 *
 * El OpenAPI no define schemas de respuesta, así que los tipos de lectura
 * derivan de los SCHEMAS del contrato (CreateFamiliarDto/UpdateFamiliarDto)
 * y del shape real del backend en runtime — campos en snake_case, según
 * Prisma. Los GET de listado incluyen a la CONTRAPARTE anidada con la
 * relación barrida de Prisma:
 *
 * - GET /familiares/mis-adultos → usuarios_adulto_familiares_adulto_idTousuarios
 * - GET /familiares/mis-familiares y /invitaciones/pendientes
 *   → usuarios_adulto_familiares_familiar_idTousuarios
 */
import type { components } from '@/types/api'

/**
 * Estado del vínculo según el contrato (UpdateFamiliarDto).
 * La fuente única de verdad para los GET es la unión del schema.
 */
type EstadoVinculo = NonNullable<
  components['schemas']['UpdateFamiliarDto']['estado']
>

/** Usuario de contraparte anidado en el vínculo (miembro de la relación). */
type UsuarioVinculo = {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono: string | null
  activo: boolean
}

/** Base común de los vínculos que devuelve el backend (SELECT_RELACION). */
type VinculoBase = {
  id: string
  familiar_id: string
  adulto_id: string
  parentesco: string | null
  es_contacto_principal: boolean
  puede_ver_ubicacion: boolean
  puede_gestionar_medicamentos: boolean
  estado: EstadoVinculo
  created_at: string
  /** El backend no selecciona updated_at en las relaciones. */
  updated_at: string | undefined
}

/**
 * GET /familiares con rol ADMINISTRADOR — vínculo con AMBAS contrapartes
 * anidadas (familiar encargado y adulto mayor), para la tabla admin.
 */
export type VinculoAdminRespuesta = VinculoBase & {
  usuarios_adulto_familiares_familiar_idTousuarios: UsuarioVinculo
  usuarios_adulto_familiares_adulto_idTousuarios: UsuarioVinculo
}

/** Forma plana para la UI admin: ambas personas al primer nivel. */
export type VinculoAdmin = {
  id: string
  familiar: {
    id: string
    nombre: string
    apellido: string
    email: string
  }
  adulto: {
    id: string
    nombre: string
    apellido: string
    email: string
  }
  parentesco: string | null
  es_contacto_principal: boolean
  puede_ver_ubicacion: boolean
  puede_gestionar_medicamentos: boolean
  estado: EstadoVinculo
}

/** GET /familiares y GET /familiares/{id} — vínculo familiar↔adulto. */
export type VinculoFamiliar = VinculoBase

/**
 * GET /familiares/mis-adultos — vínculos del usuario autenticado como
 * familiar encargado, con el adulto mayor anidado.
 */
export type AdultoVinculadoRespuesta = VinculoBase & {
  usuarios_adulto_familiares_adulto_idTousuarios: UsuarioVinculo
}

/**
 * GET /familiares/mis-familiares — vínculos del adulto del usuario con
 * sesión, con el familiar encargado anidado.
 */
export type FamiliarVinculadoRespuesta = VinculoBase & {
  usuarios_adulto_familiares_familiar_idTousuarios: UsuarioVinculo
}

/**
 * GET /familiares/invitaciones/pendientes — invitación PENDIENTE dirigida
 * al usuario autenticado (como adulto mayor de un vínculo).
 */
export type InvitacionPendienteRespuesta = VinculoBase & {
  usuarios_adulto_familiares_familiar_idTousuarios: UsuarioVinculo
}

/**
 * Forma plana que consume la UI, derivada del shape anidado de arriba.
 * `vinculo_id` es la clave del vínculo (caso mis-adultos/mis-familiares)
 * y los datos de la contraparte quedan al primer nivel.
 */
export type AdultoVinculado = {
  id: string
  vinculo_id: string
  nombre: string
  apellido: string
  email: string
  parentesco: string | null
  es_contacto_principal: boolean
  puede_ver_ubicacion: boolean
  puede_gestionar_medicamentos: boolean
  estado: EstadoVinculo
}

export type FamiliarVinculado = {
  id: string
  vinculo_id: string
  nombre: string
  apellido: string
  email: string
  parentesco: string | null
  es_contacto_principal: boolean
  puede_ver_ubicacion: boolean
  puede_gestionar_medicamentos: boolean
  estado: EstadoVinculo
}

/**
 * Convierte un vínculo en formato admin (GET /familiares, vista
 * ADMINISTRADOR) a la forma plana que consume el modal de 2FA asistido,
 * usando al adulto mayor de la relación como objetivo.
 */
export function adultoDesdeVinculoAdmin(vinculo: VinculoAdmin): AdultoVinculado {
  return {
    id: vinculo.adulto.id,
    vinculo_id: vinculo.id,
    nombre: vinculo.adulto.nombre,
    apellido: vinculo.adulto.apellido,
    email: vinculo.adulto.email,
    parentesco: vinculo.parentesco,
    es_contacto_principal: vinculo.es_contacto_principal,
    puede_ver_ubicacion: vinculo.puede_ver_ubicacion,
    puede_gestionar_medicamentos: vinculo.puede_gestionar_medicamentos,
    estado: vinculo.estado,
  }
}

/**
 * POST /familiares/invitaciones y /completar — bodies de las mutaciones
 * de invitación, según los DTOs del backend.
 */
export type InvitacionPendiente = {
  id: string
  vinculo_id: string
  familiar_nombre: string
  familiar_apellido: string
  familiar_email: string
  parentesco: string | null
  created_at: string
}

/** POST /familiares — body (CreateFamiliarDto). */
export type CrearVinculo = components['schemas']['CreateFamiliarDto']

/** PATCH /familiares/{id} — body (UpdateFamiliarDto). */
export type ActualizarVinculo = components['schemas']['UpdateFamiliarDto']

/** POST /familiares/invitaciones — body. */
export type CrearInvitacion =
  components['schemas']['CrearInvitacionFamiliarDto']

/** POST /familiares/invitaciones/completar — body. */
export type CompletarInvitacion =
  components['schemas']['CompletarInvitacionFamiliarDto']

/** GET /familiares/{id} — parámetros de la operación findOne. */
export type ParametrosIdVinculo = {
  id: string
}
