import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuthStore } from '@/stores/auth-store'

import { authApi } from '../api/auth.api'


export const clavesDosPasos = {
  todas: ['dos-pasos-propio'] as const,
  setup: ['dos-pasos-propio', 'setup'] as const,
}

/**
 * POST /auth/2fa/setup — genera el secreto TOTP de la cuenta con sesión.
 * Query manual: el backend crea/configura el secreto al invocarla, así
 * que la página la ejecuta al pulsar «Generar código QR».
 */
export function useSetupDosPasos() {
  return useQuery({
    queryKey: clavesDosPasos.setup,
    queryFn: () => authApi.setupDosPasos(),
    enabled: false,
    refetchOnWindowFocus: false,
  })
}


export function useConfirmarDosPasos() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (code: string) => authApi.confirmarDosPasos(code),
    onSuccess: () => {
      marcarDosPasos(true)
      // El setup queda consumido; reactivarlo requiere generar otro QR.
      void queryClient.resetQueries({ queryKey: clavesDosPasos.setup })
    },
  })
}

export function useDesactivarDosPasos() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (password: string) => authApi.desactivarDosPasos(password),
    onSuccess: () => {
      marcarDosPasos(false)
      void queryClient.resetQueries({ queryKey: clavesDosPasos.setup })
    },
  })
}

/**
 * Actualiza twoFactorEnabled del usuario de sesión (zustand persistido)
 * para que el sidebar/estado del app refleje el cambio sin relogin.
 */
function marcarDosPasos(habilitado: boolean) {
  useAuthStore.setState((state) =>
    state.usuario
      ? { usuario: { ...state.usuario, twoFactorEnabled: habilitado } }
      : {},
  )
}
