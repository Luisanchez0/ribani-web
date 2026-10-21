import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { queryClient } from '@/lib/query-client'
import type { components } from '@/types/api'


export type RolSesion = components['schemas']['RolSesionDto']
export type UsuarioSesion = components['schemas']['UsuarioSesionDto']

type AuthState = {
  /** Cambia al terminar una sesión o cambiar de cuenta, nunca al renovar tokens. */
  sessionRevision: number
  token: string | null
  refreshToken: string | null
  usuario: UsuarioSesion | null
  setSesion: (sesion: {
    accessToken: string
    refreshToken: string
    usuario: UsuarioSesion
  }) => void
  /** Fusiona cambios parciales sobre el usuario de sesión (p. ej. perfil editado). */
  actualizarUsuario: (cambios: Partial<UsuarioSesion>) => void
  clearSesion: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      sessionRevision: 0,
      token: null,
      refreshToken: null,
      usuario: null,
      setSesion: ({ accessToken, refreshToken, usuario }) => {
        const cambioDeCuenta = get().usuario?.id !== usuario.id
        set({
          token: accessToken, refreshToken, usuario,
          ...(cambioDeCuenta ? { sessionRevision: get().sessionRevision + 1 } : {}),
        })
        if (cambioDeCuenta) queryClient.clear()
      },
      actualizarUsuario: (cambios) =>
        set((estado) => ({
          usuario: estado.usuario
            ? { ...estado.usuario, ...cambios }
            : estado.usuario,
        })),
      clearSesion: () => {
        set({
          token: null, refreshToken: null, usuario: null,
          sessionRevision: get().sessionRevision + 1,
        })
        // clear destruye y cancela las consultas, incluso las que siguen en vuelo.
        queryClient.clear()
      },
    }),
    {
      name: 'ribani-auth',
      partialize: ({ token, refreshToken, usuario }) => ({ token, refreshToken, usuario }),
    },
  ),
)
