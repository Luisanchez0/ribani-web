import { apiClient } from '@/lib/api-client'

import type {
  FiltrosHistorial,
  RegistrarUbicacion,
  Ubicacion,
} from '../types'



const mapearUbicacion = (cru: Ubicacion): Ubicacion => ({
  ...cru,
  latitud: Number(cru.latitud),
  longitud: Number(cru.longitud),
  precision_metros:
    cru.precision_metros === null ? null : Number(cru.precision_metros),
  altitud_metros:
    cru.altitud_metros === null ? null : Number(cru.altitud_metros),
})


export const ubicacionesApi = {
  /** GET /ubicaciones/actual — última ubicación registrada del adulto. */
  actual(adultoId: string): Promise<Ubicacion> {
    return apiClient
      .get<Ubicacion>('/ubicaciones/actual', { params: { adultoId } })
      .then((response) => mapearUbicacion(response.data))
  },

  /** GET /ubicaciones/historial — últimas N ubicaciones (desc). */
  historial(filtros: FiltrosHistorial & { adultoId: string }): Promise<Ubicacion[]> {
    return apiClient
      .get<Ubicacion[]>('/ubicaciones/historial', { params: filtros })
      .then((response) => response.data.map(mapearUbicacion))
  },

  /** POST /ubicaciones — reportar una ubicación (app móvil del adulto). */
  reportar(datos: RegistrarUbicacion): Promise<Ubicacion> {
    return apiClient
      .post<Ubicacion>('/ubicaciones', datos)
      .then((response) => response.data)
  },
}
