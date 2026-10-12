import { apiClient } from '@/lib/api-client'

import type {
  ActualizarContacto,
  Contacto,
  CrearContacto,
  FiltrosContactos,
} from '../types'

export const contactosApi = {
  listar(filtros?: FiltrosContactos): Promise<Contacto[]> {
    return apiClient
      .get<Contacto[]>('/contactos', { params: filtros })
      .then((response) => response.data)
  },

  obtener(id: string): Promise<Contacto> {
    return apiClient
      .get<Contacto>(`/contactos/${id}`)
      .then((response) => response.data)
  },

  crear(datos: CrearContacto): Promise<void> {
    return apiClient
      .post('/contactos', datos)
      .then(() => undefined)
  },

  actualizar(id: string, datos: ActualizarContacto): Promise<void> {
    return apiClient
      .patch(`/contactos/${id}`, datos)
      .then(() => undefined)
  },

  /** DELETE /contactos/{id} — baja del contacto (sin body). */
  eliminar(id: string): Promise<void> {
    return apiClient
      .delete(`/contactos/${id}`)
      .then(() => undefined)
  },
}
