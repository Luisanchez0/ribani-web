import { useMutation } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/stores/auth-store'

import { authApi } from '../api/auth.api'
import { esDesafioDosPasos } from '../types'
import type { CredencialesLogin } from '../types'

/** Recupera el destino original guardado por RequireAuth, si existe. */
function destinoDesdeEstado(estado: unknown): string {
  if (
    typeof estado === 'object' &&
    estado !== null &&
    'from' in estado &&
    typeof estado.from === 'string'
  ) {
    return estado.from
  }

  return '/panel'
}

export function useLogin() {
  const setSesion = useAuthStore((state) => state.setSesion)
  const navigate = useNavigate()
  const location = useLocation()

  return useMutation({
    mutationFn: (credenciales: CredencialesLogin) =>
      authApi.login(credenciales),
    onSuccess: (respuesta) => {
      if (esDesafioDosPasos(respuesta)) {
        // El flujo de 2FA (POST /auth/2fa/login) se implementará en esta
        // feature; por ahora la UI informa al usuario.
        return
      }

      setSesion({
        accessToken: respuesta.accessToken,
        refreshToken: respuesta.refreshToken,
        usuario: respuesta.user,
      })

      navigate(destinoDesdeEstado(location.state), { replace: true })
    },
  })
}
