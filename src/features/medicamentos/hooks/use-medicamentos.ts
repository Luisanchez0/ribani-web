import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { medicamentosApi } from '../api/medicamentos.api'
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
} from '../types'

/** Claves de cache de la feature (convención de AGENTS.md). */
export const clavesMedicamentos = {
  todos: ['medicamentos'] as const,
  lista: (filtros?: FiltrosMedicamentos) =>
    ['medicamentos', filtros ?? {}] as const,
  detalle: (id: string) => ['medicamentos', id] as const,
  horarios: (medicamentoId: string) =>
    ['medicamentos', medicamentoId, 'horarios'] as const,
  tomas: ['tomas'] as const,
  listaTomas: (filtros?: FiltrosTomas) => ['tomas', filtros ?? {}] as const,
}

/** GET /medicamentos — lista de medicamentos del adulto. */
export function useMedicamentos(filtros?: FiltrosMedicamentos) {
  return useQuery({
    queryKey: clavesMedicamentos.lista(filtros),
    queryFn: () => medicamentosApi.listar(filtros),
  })
}

/** GET /medicamentos/{id} — detalle de un medicamento. */
export function useMedicamento(id: string) {
  return useQuery({
    queryKey: clavesMedicamentos.detalle(id),
    queryFn: () => medicamentosApi.obtener(id),
  })
}

/** GET /medicamentos/{id}/horarios — horarios de un medicamento. */
export function useHorarios(medicamentoId: string, filtros?: FiltrosHorarios) {
  return useQuery({
    queryKey: [...clavesMedicamentos.horarios(medicamentoId), filtros ?? {}],
    queryFn: () => medicamentosApi.listarHorarios(medicamentoId, filtros),
  })
}

/** GET /tomas — registro de tomas (opcionalmente filtrado). */
export function useTomas(filtros?: FiltrosTomas) {
  return useQuery({
    queryKey: clavesMedicamentos.listaTomas(filtros),
    queryFn: () => medicamentosApi.listarTomas(filtros),
  })
}

/** POST /medicamentos — crea un medicamento. */
export function useCrearMedicamento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (datos: CrearMedicamento) => medicamentosApi.crear(datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: clavesMedicamentos.todos,
      })
    },
  })
}

/** PATCH /medicamentos/{id} — actualiza datos editables del medicamento. */
export function useActualizarMedicamento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: ActualizarMedicamento }) =>
      medicamentosApi.actualizar(id, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: clavesMedicamentos.todos,
      })
    },
  })
}

/** DELETE /medicamentos/{id} — baja de un medicamento. */
export function useEliminarMedicamento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => medicamentosApi.eliminar(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: clavesMedicamentos.todos,
      })
    },
  })
}

/** POST /medicamentos/{id}/horarios — crea un horario de toma. */
export function useCrearHorario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      medicamentoId,
      datos,
    }: {
      medicamentoId: string
      datos: CrearHorario
    }) => medicamentosApi.crearHorario(medicamentoId, datos),
    onSuccess: (_resultado, { medicamentoId }) => {
      void queryClient.invalidateQueries({
        queryKey: clavesMedicamentos.horarios(medicamentoId),
      })
    },
  })
}

/** PATCH /medicamentos/{id}/horarios/{hid} — actualiza un horario. */
export function useActualizarHorario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      medicamentoId,
      id,
      datos,
    }: {
      medicamentoId: string
      id: string
      datos: ActualizarHorario
    }) => medicamentosApi.actualizarHorario(medicamentoId, id, datos),
    onSuccess: (_resultado, { medicamentoId }) => {
      void queryClient.invalidateQueries({
        queryKey: clavesMedicamentos.horarios(medicamentoId),
      })
    },
  })
}

/** DELETE /medicamentos/{id}/horarios/{hid} — baja de un horario. */
export function useEliminarHorario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      medicamentoId,
      id,
    }: {
      medicamentoId: string
      id: string
    }) => medicamentosApi.eliminarHorario(medicamentoId, id),
    onSuccess: (_resultado, { medicamentoId }) => {
      void queryClient.invalidateQueries({
        queryKey: clavesMedicamentos.horarios(medicamentoId),
      })
    },
  })
}

/** POST /tomas — registra una toma programada. */
export function useCrearToma() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (datos: CrearToma) => medicamentosApi.crearToma(datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesMedicamentos.tomas })
    },
  })
}

/** PATCH /tomas/{id} — marca TOMADA/OMITIDA o edita el registro. */
export function useActualizarToma() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: ActualizarToma }) =>
      medicamentosApi.actualizarToma(id, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesMedicamentos.tomas })
    },
  })
}

/** DELETE /tomas/{id} — baja de un registro de toma. */
export function useEliminarToma() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => medicamentosApi.eliminarToma(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesMedicamentos.tomas })
    },
  })
}
