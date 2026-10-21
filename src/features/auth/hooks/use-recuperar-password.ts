import { useMutation } from '@tanstack/react-query'

import { authApi } from '../api/auth.api'

/**
 * Flujo de recuperación de contraseña:
 * 1. solicitar → POST /auth/forgot-password (código por correo, 10 min).
 * 2. restablecer → POST /auth/reset-password (código + contraseña nueva).
 *
 * La solicitud siempre responde con un mensaje genérico: el paso 1 se
 * considera exitoso salvo error de red; no se revela si el correo existe.
 */
export function useRecuperarPassword() {
  const solicitar = useMutation({
    mutationFn: (email: string) => authApi.solicitarReset(email.trim()),
  })

  const restablecer = useMutation({
    mutationFn: (datos: { email: string; codigo: string; password: string }) =>
      authApi.resetPassword(datos),
  })

  return { solicitar, restablecer }
}
