/**
 * Contrato de la feature de usuarios, tomado de src/types/api.d.ts
 * (generado con openapi-typescript desde ribani-server).
 *
 * Usuarios/perfil provienen del contrato generado. El tipo de lectura de
 * roles sigue pendiente de su esquema de respuesta en el backend.
 */
import type { components, operations } from '@/types/api'

/** GET /usuarios — fila de usuario (snake_case, según Prisma). */
export type UsuarioLista = components['schemas']['UsuarioRespuestaDto']

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

/** PATCH /usuarios/perfil/password — body (CambiarPasswordDto). */
export type CambiarPassword = components['schemas']['CambiarPasswordDto']

/** PATCH /usuarios/perfil — body (UpdatePerfilDto): solo datos personales del perfil propio. */
export type ActualizarPerfil = components['schemas']['UpdatePerfilDto']

/** POST /usuarios — body (CreateUsuarioDto). */
export type CrearUsuario = components['schemas']['CreateUsuarioDto']

/** PATCH /usuarios/{id} — body (UpdateUsuarioDto). */
export type ActualizarUsuario = components['schemas']['UpdateUsuarioDto']

/** GET /usuarios — filtros de query soportados por el backend. */
export type FiltrosUsuarios = operations['UsuariosController_findAll']['parameters']['query']
