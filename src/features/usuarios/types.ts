/**
 * Contrato de la feature de usuarios, tomado de src/types/api.d.ts
 * (generado con openapi-typescript desde ribani-server).
 *
 * El OpenAPI no define schemas de respuesta, así que los tipos de lectura
 * reflejan exactamente lo que devuelve el backend verificado en runtime
 * (GET /usuarios y GET /roles con sesión admin).
 */
import type { components, operations } from '@/types/api'

/** GET /usuarios — fila de usuario (snake_case, según Prisma). */
export type UsuarioLista = {
  id: string
  rol_id: number
  nombre: string
  apellido: string
  email: string
  telefono: string | null
  email_verificado_en: string | null
  activo: boolean
  ultimo_acceso_en: string | null
  created_at: string
  updated_at: string
}

/** GET /roles — rol con sus permisos anidados. */
export type RolLista = {
  id: number
  codigo: string
  nombre: string
  descripcion: string | null
  activo: boolean
  permisos: Array<{
    id: string
    codigo: string
    recurso: string
    accion: string
    descripcion: string | null
  }>
}

/** POST /usuarios — body (CreateUsuarioDto). */
export type CrearUsuario = components['schemas']['CreateUsuarioDto']

/** PATCH /usuarios/{id} — body (UpdateUsuarioDto). */
export type ActualizarUsuario = components['schemas']['UpdateUsuarioDto']

/** GET /usuarios — filtros de query soportados por el backend. */
export type FiltrosUsuarios = operations['UsuariosController_findAll']['parameters']['query']
