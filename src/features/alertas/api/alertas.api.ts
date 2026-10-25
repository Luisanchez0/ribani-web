import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/lib/api-client'

/** GET /alertas — fila de alerta (shape runtime, snake_case Prisma). */
export type Alerta = {
  id: string
  adulto_id: string
  dispositivo_id: string | null
  tipo: 'SOS' | 'CAIDA' | 'ZONA_SEGURA' | 'MEDICAMENTO' | 'INACTIVIDAD' | 'SISTEMA' | 'OTRA'
  severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  estado: 'ABIERTA' | 'EN_ATENCION' | 'RESUELTA' | 'CANCELADA'
  titulo: string
  descripcion: string | null
  latitud: number | null
  longitud: number | null
  ocurrida_en: string
  atendida_por: string | null
  atendida_en: string | null
  cerrada_en: string | null
  created_at: string
}

/** GET /alertas/{id} — evento de la bitácora (id BigInt serializado a string). */
export type EventoAlerta = {
  id: string
  alerta_id: string
  usuario_id: string | null
  evento: string
  detalle: string | null
  created_at: string
}

/** GET /alertas/{id} — alerta con su bitácora de eventos. */
export type AlertaDetalle = Alerta & {
  eventos: EventoAlerta[]
}

/** PATCH /alertas/{id} — body (ResolverAlertaDto). */
export type TransicionAlerta = {
  estado: 'EN_ATENCION' | 'RESUELTA' | 'CANCELADA'
  detalle?: string
}

/** Uso directo de apiClient (feature alertas, sin módulo api separado). */
export const alertasApi = {
  listar(params: { adultoId?: string; estado?: string; limite?: number } = {}) {
    return apiClient
      .get<Alerta[]>('/alertas', { params })
      .then((response) => response.data)
  },

  obtener(id: string) {
    return apiClient
      .get<AlertaDetalle>(`/alertas/${id}`)
      .then((response) => response.data)
  },

  /** PATCH /alertas/{id} — atender (EN_ATENCION), resolver o cancelar. */
  actualizar(id: string, cuerpo: TransicionAlerta) {
    return apiClient
      .patch(`/alertas/${id}`, cuerpo)
      .then(() => undefined)
  },

  /** DELETE /alertas/{id} — borra la alerta del historial (baja lógica). */
  eliminar(id: string) {
    return apiClient
      .delete(`/alertas/${id}`)
      .then(() => undefined)
  },
}

/** Claves de cache de la feature. */
export const clavesAlertas = {
  todos: ['alertas'] as const,
  lista: (params: { adultoId?: string; estado?: string; limite?: number }) =>
    ['alertas', params] as const,
  detalle: (id: string) => ['alertas', id] as const,
}

/**
 * GET /alertas — con rol ADMIN el backend devuelve TODAS las alertas del
 * sistema; con sesión familiar se filtra por adulto (también autorizado).
 */
export function useAlertas(
  params: { adultoId?: string; estado?: string; limite?: number } = {},
) {
  return useQuery({
    queryKey: clavesAlertas.lista(params),
    queryFn: () => alertasApi.listar(params),
  })
}

/** GET /alertas/{id} — detalle con bitácora de eventos. */
export function useAlerta(id: string) {
  return useQuery({
    queryKey: clavesAlertas.detalle(id),
    queryFn: () => alertasApi.obtener(id),
  })
}

/** DELETE /alertas/{id} — quita la alerta del historial (familiar o admin). */
export function useEliminarAlerta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => alertasApi.eliminar(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesAlertas.todos })
    },
  })
}

/** PATCH /alertas/{id} — atender/resolver/cancelar (familiar o admin). */
export function useActualizarAlerta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, cuerpo }: { id: string; cuerpo: TransicionAlerta }) =>
      alertasApi.actualizar(id, cuerpo),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesAlertas.todos })
    },
  })
}
