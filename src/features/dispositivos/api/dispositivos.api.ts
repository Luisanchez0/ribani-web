import { apiClient } from '@/lib/api-client'

import { normalizarDispositivo } from '../types'
import type {
  ActualizarDispositivo,
  CrearDispositivo,
  Dispositivo,
  FiltrosDispositivos,
} from '../types'

/**
 * Endpoints reales del backend (ribani-server → DispositivosController):
 * - GET    /dispositivos             (query: usuarioId, soloActivas)
 * - POST   /dispositivos
 * - GET    /dispositivos/{id}
 * - PATCH  /dispositivos/{id}        (UpdateDispositivoDto)
 * - DELETE /dispositivos/{id}
 * - POST   /dispositivos/{id}/latido (heartbeat, sin body)
 */
export const dispositivosApi = {
  listar(filtros?: FiltrosDispositivos): Promise<Dispositivo[]> {
    return apiClient
      .get<Record<string, unknown>[]>('/dispositivos', { params: filtros })
      .then((response) => response.data.map(normalizarDispositivo))
  },

  registrar(datos: CrearDispositivo): Promise<void> {
    return apiClient
      .post('/dispositivos', datos)
      .then(() => undefined)
  },

  obtener(id: string): Promise<Dispositivo> {
    return apiClient
      .get<Record<string, unknown>>(`/dispositivos/${id}`)
      .then((response) => normalizarDispositivo(response.data))
  },

  actualizar(id: string, datos: ActualizarDispositivo): Promise<void> {
    return apiClient
      .patch(`/dispositivos/${id}`, datos)
      .then(() => undefined)
  },

  eliminar(id: string): Promise<void> {
    return apiClient
      .delete(`/dispositivos/${id}`)
      .then(() => undefined)
  },

  latido(id: string): Promise<void> {
    return apiClient
      .post(`/dispositivos/${id}/latido`)
      .then(() => undefined)
  },
}
