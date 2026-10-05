import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Zustand está reservado EXCLUSIVAMENTE para la sesión (ver AGENTS.md):
 * token, usuario, rol y estado de autenticación. Los datos de dominio
 * (medicamentos, alertas, ubicaciones…) pertenecen a TanStack Query.
 *
 * TODO: reemplazar los tipos de sesión por los generados en
 * `src/types/api.d.ts` en cuanto se regeneren con el backend corriendo.
 * La forma refleja la respuesta real del backend
 * (ribani-server → AuthService.issueTokens).
 */

export type RolSesion = {
  id: number
  codigo: string
  nombre: string
}

export type UsuarioSesion = {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono: string | null
  emailVerificado: boolean
  twoFactorEnabled: boolean
  rol: RolSesion
  permisos: string[]
}

type AuthState = {
  token: string | null
  refreshToken: string | null
  usuario: UsuarioSesion | null
  setSesion: (sesion: {
    accessToken: string
    refreshToken: string
    usuario: UsuarioSesion
  }) => void
  clearSesion: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      usuario: null,
      setSesion: ({ accessToken, refreshToken, usuario }) =>
        set({ token: accessToken, refreshToken, usuario }),
      clearSesion: () =>
        set({ token: null, refreshToken: null, usuario: null }),
    }),
    { name: 'ribani-auth' },
  ),
)
