import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/stores/auth-store'

import { authApi } from '../api/auth.api'

export function useLogout() {
  const refreshToken = useAuthStore((state) => state.refreshToken)
  const clearSesion = useAuthStore((state) => state.clearSesion)
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: async () => {
      // Revocar la sesión del backend es best-effort: el usuario siempre
      // debe poder salir, aunque el refresh token ya esté revocado.
      if (refreshToken) {
        try {
          await authApi.logout({ refreshToken })
        } catch {
          // Se ignora el error del backend y se limpia la sesión local.
        }
      }
    },
    onSettled: () => {
      clearSesion()
      navigate('/login', { replace: true })
    },
  })

  return { cerrarSesion: mutation.mutate, pendiente: mutation.isPending }
}
