import { useMutation } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/stores/auth-store'

import { authApi } from '../api/auth.api'
import { destinoDesdeEstado } from './use-login'

/**
 * Paso 2 del login con 2FA (POST /auth/2fa/login): envía el código TOTP
 * junto al challengeToken del primer paso y, si es correcto, guarda la
 * sesión y navega al destino original (el backend emite los tokens
 * definitivos con issueTokens).
 */
export function useLoginDosPasos() {
  const setSesion = useAuthStore((state) => state.setSesion)
  const navigate = useNavigate()
  const location = useLocation()

  return useMutation({
    mutationFn: ({ challengeToken, code }: { challengeToken: string; code: string }) =>
      authApi.loginDosPasos(challengeToken, code),
    onSuccess: (respuesta) => {
      setSesion({
        accessToken: respuesta.accessToken,
        refreshToken: respuesta.refreshToken,
        usuario: respuesta.user,
      })

      navigate(destinoDesdeEstado(location.state), { replace: true })
    },
  })
}
