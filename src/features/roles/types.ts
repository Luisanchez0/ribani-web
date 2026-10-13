
import type { components, operations } from '@/types/api'

export type RolLista = {
  id: number
  codigo: string
  nombre: string
  descripcion: string | null
  activo: boolean
  permisos: Permiso[]
}

export type RolDetalle = RolLista

export type Permiso = {
  id: string
  codigo: string
  recurso: string
  accion: string
  descripcion: string | null
}

export type ActualizarRol = components['schemas']['UpdateRolDto']

export type AsignarPermisos = components['schemas']['AsignarPermisosDto']

export type ParametrosOperacionRol =
  operations['RolesController_actualizar']['parameters']['path']
