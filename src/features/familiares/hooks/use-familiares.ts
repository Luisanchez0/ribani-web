import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { familiaresApi } from '../api/familiares.api'
import type {
  ActualizarVinculo,
  CompletarInvitacion,
  CrearInvitacion,
  CrearVinculo,
} from '../types'

/** Claves de cache 2FA asistido (por adulto). */
export const clavesDosPasos = {
  setup: (adultoId: string) => ['dos-pasos', adultoId] as const,
}

/** Claves de cache de la feature (convención de AGENTS.md). */
export const clavesFamiliares = {
  todos: ['familiares'] as const,
  vinculos: ['familiares', 'vinculos'] as const,
  misAdultos: ['familiares', 'mis-adultos'] as const,
  misFamiliares: ['familiares', 'mis-familiares'] as const,
  invitacionesPendientes: ['familiares', 'invitaciones-pendientes'] as const,
  detalle: (id: string) => ['familiares', id] as const,
}

/** GET /familiares — lista completa de vínculos (admin/depuración). */
export function useVinculos() {
  return useQuery({
    queryKey: clavesFamiliares.vinculos,
    queryFn: () => familiaresApi.listar(),
  })
}

/** GET /familiares/mis-adultos — adultos a cargo del usuario con sesión. */
export function useMisAdultos(enabled = true) {
  return useQuery({
    queryKey: clavesFamiliares.misAdultos,
    queryFn: () => familiaresApi.misAdultos(),
    enabled,
  })
}

/** GET /familiares/mis-familiares — familiares del adulto del usuario con sesión. */
export function useMisFamiliares() {
  return useQuery({
    queryKey: clavesFamiliares.misFamiliares,
    queryFn: () => familiaresApi.misFamiliares(),
  })
}

/** GET /familiares/invitaciones/pendientes — invitaciones dirigidas al usuario. */
export function useInvitacionesPendientes() {
  return useQuery({
    queryKey: clavesFamiliares.invitacionesPendientes,
    queryFn: () => familiaresApi.invitacionesPendientes(),
  })
}

/** GET /familiares/{id} — detalle de un vínculo. */
export function useVinculo(id: string) {
  return useQuery({
    queryKey: clavesFamiliares.detalle(id),
    queryFn: () => familiaresApi.obtener(id),
  })
}

/** POST /familiares — vincula un familiar registrado con un adulto. */
export function useVincularFamiliar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (datos: CrearVinculo) => familiaresApi.vincular(datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesFamiliares.todos })
    },
  })
}

/** PATCH /familiares/{id} — parentesco/permisos/estado del vínculo. */
export function useActualizarVinculo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: ActualizarVinculo }) =>
      familiaresApi.actualizar(id, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesFamiliares.todos })
    },
  })
}

/** DELETE /familiares/{id} — revoca o elimina el vínculo. */
export function useDesvincularFamiliar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => familiaresApi.desvincular(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesFamiliares.todos })
    },
  })
}

/** POST /familiares/invitaciones — invita a cuidar a un adulto. */
export function useInvitarFamiliar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (datos: CrearInvitacion) => familiaresApi.invitar(datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesFamiliares.todos })
    },
  })
}

/** POST /familiares/invitaciones/completar — crea la cuenta desde una invitación. */
export function useCompletarInvitacion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (datos: CompletarInvitacion) =>
      familiaresApi.completarInvitacion(datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesFamiliares.todos })
    },
  })
}

/** POST /familiares/invitaciones/{id}/aceptar — acepta la invitación. */
export function useAceptarInvitacion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => familiaresApi.aceptarInvitacion(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesFamiliares.todos })
    },
  })
}

/** POST /familiares/invitaciones/{id}/rechazar — rechaza la invitación. */
export function useRechazarInvitacion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => familiaresApi.rechazarInvitacion(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesFamiliares.todos })
    },
  })
}

/**
 * POST /usuarios/{id}/2fa/setup — genera el secreto TOTP para el adulto
 * y devuelve la URI otpauth que se renderiza como QR en el modal.
 */
export function useSetupDosPasos(adultoId: string) {
  return useQuery({
    queryKey: clavesDosPasos.setup(adultoId),
    queryFn: () => familiaresApi.setupDosPasos(adultoId),
    /** El secreto se genera al abrir el modal, no al montar la página. */
    enabled: false,
    refetchOnWindowFocus: false,
  })
}

/** POST /usuarios/{id}/2fa/verify — activa el 2FA del adulto con el código. */
export function useConfirmarDosPasos(adultoId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (code: string) => familiaresApi.confirmarDosPasos(adultoId, code),
    onSuccess: () => {
      // El setup queda consumido; la próxima reconfiguración genera otro QR.
      void queryClient.resetQueries({
        queryKey: clavesDosPasos.setup(adultoId),
      })
    },
  })
}
