import { apiClient } from '@/lib/api-client'

import type {
  ActualizarHorario,
  ActualizarMedicamento,
  ActualizarToma,
  CrearHorario,
  CrearMedicamento,
  CrearToma,
  FiltrosHorarios,
  FiltrosMedicamentos,
  FiltrosTomas,
  Horario,
  Medicamento,
  Toma,
} from '../types'

/**
 * Endpoints reales del backend (ribani-server):
 * - GET    /medicamentos                       (query: soloActivos, adultoId)
 * - POST   /medicamentos
 * - GET    /medicamentos/{id}
 * - PATCH  /medicamentos/{id}
 * - DELETE /medicamentos/{id}
 * - GET    /medicamentos/{id}/horarios         (query: soloActivos)
 * - POST   /medicamentos/{id}/horarios
 * - GET    /medicamentos/{id}/horarios/{hid}
 * - PATCH  /medicamentos/{id}/horarios/{hid}
 * - DELETE /medicamentos/{id}/horarios/{hid}
 * - GET    /tomas                              (query: adultoId, medicamentoId, estado, desde, hasta)
 * - POST   /tomas
 * - GET    /tomas/{id}
 * - PATCH  /tomas/{id}
 * - DELETE /tomas/{id}
 */
export const medicamentosApi = {
  listar(filtros?: FiltrosMedicamentos): Promise<Medicamento[]> {
    return apiClient
      .get<Medicamento[]>('/medicamentos', { params: filtros })
      .then((response) => response.data)
  },

  crear(datos: CrearMedicamento): Promise<void> {
    return apiClient
      .post('/medicamentos', datos)
      .then(() => undefined)
  },

  obtener(id: string): Promise<Medicamento> {
    return apiClient
      .get<Medicamento>(`/medicamentos/${id}`)
      .then((response) => response.data)
  },

  actualizar(id: string, datos: ActualizarMedicamento): Promise<void> {
    return apiClient
      .patch(`/medicamentos/${id}`, datos)
      .then(() => undefined)
  },

  /** DELETE /medicamentos/{id} — baja del medicamento (sin body). */
  eliminar(id: string): Promise<void> {
    return apiClient
      .delete(`/medicamentos/${id}`)
      .then(() => undefined)
  },

  listarHorarios(
    medicamentoId: string,
    filtros?: FiltrosHorarios,
  ): Promise<Horario[]> {
    return apiClient
      .get<Horario[]>(`/medicamentos/${medicamentoId}/horarios`, {
        params: filtros,
      })
      .then((response) => response.data)
  },

  crearHorario(medicamentoId: string, datos: CrearHorario): Promise<void> {
    return apiClient
      .post(`/medicamentos/${medicamentoId}/horarios`, datos)
      .then(() => undefined)
  },

  actualizarHorario(
    medicamentoId: string,
    id: string,
    datos: ActualizarHorario,
  ): Promise<void> {
    return apiClient
      .patch(`/medicamentos/${medicamentoId}/horarios/${id}`, datos)
      .then(() => undefined)
  },

  /** DELETE /medicamentos/{id}/horarios/{hid} — baja del horario (sin body). */
  eliminarHorario(medicamentoId: string, id: string): Promise<void> {
    return apiClient
      .delete(`/medicamentos/${medicamentoId}/horarios/${id}`)
      .then(() => undefined)
  },

  listarTomas(filtros?: FiltrosTomas): Promise<Toma[]> {
    return apiClient
      .get<Toma[]>('/tomas', { params: filtros })
      .then((response) => response.data)
  },

  crearToma(datos: CrearToma): Promise<void> {
    return apiClient
      .post('/tomas', datos)
      .then(() => undefined)
  },

  obtenerToma(id: string): Promise<Toma> {
    return apiClient
      .get<Toma>(`/tomas/${id}`)
      .then((response) => response.data)
  },

  actualizarToma(id: string, datos: ActualizarToma): Promise<void> {
    return apiClient
      .patch(`/tomas/${id}`, datos)
      .then(() => undefined)
  },

  /** DELETE /tomas/{id} — baja del registro de toma (sin body). */
  eliminarToma(id: string): Promise<void> {
    return apiClient
      .delete(`/tomas/${id}`)
      .then(() => undefined)
  },
}
