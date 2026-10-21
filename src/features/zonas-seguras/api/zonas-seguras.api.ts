import { apiClient } from '@/lib/api-client'

import type {
  ActualizarZonaSegura,
  CrearZonaSegura,
  ZonaSegura,
} from '../types'

export const zonasSegurasApi = {
  /** GET /zonas-seguras — por defecto solo activas; adultoId opcional. */
  listar(filtros: { adultoId?: string; soloActivas?: boolean } = {}): Promise<ZonaSegura[]> {
    return apiClient
      .get<ZonaSegura[]>('/zonas-seguras', {
        params: {
          ...(filtros.adultoId ? { adultoId: filtros.adultoId } : {}),
          ...(filtros.soloActivas === false ? { soloActivas: 'false' } : {}),
        },
      })
      .then((response) => response.data)
  },

  crear(datos: CrearZonaSegura): Promise<ZonaSegura> {
    return apiClient
      .post<ZonaSegura>('/zonas-seguras', datos)
      .then((response) => response.data)
  },

  actualizar(id: string, datos: ActualizarZonaSegura): Promise<ZonaSegura> {
    return apiClient
      .patch<ZonaSegura>(`/zonas-seguras/${id}`, datos)
      .then((response) => response.data)
  },

  /** DELETE /zonas-seguras/{id} — baja lógica (la zona queda inactiva). */
  eliminar(id: string): Promise<void> {
    return apiClient.delete(`/zonas-seguras/${id}`).then(() => undefined)
  },
}
