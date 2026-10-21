import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/stores/auth-store'

import { authApi } from '../api/auth.api'

export function useLogout() {
  const navigate = useNavigate()

  const mutation = useMutation({
    // Salir debe limpiar el estado local incluso si el navegador está offline.
    networkMode: 'always',
    mutationFn: async () => {
      const { refreshToken, clearSesion } = useAuthStore.getState()
      // La limpieza local ocurre al pulsar salir, aunque el servidor tarde.
      clearSesion()
      navigate('/login', { replace: true })
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
  })

  return { cerrarSesion: mutation.mutate, pendiente: mutation.isPending }
}
