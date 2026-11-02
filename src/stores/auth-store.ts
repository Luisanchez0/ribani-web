import { create } from 'zustand'
import { queryClient } from '@/lib/query-client'
import type { components } from '@/types/api'


export type RolSesion = components['schemas']['RolSesionDto']
export type UsuarioSesion = components['schemas']['UsuarioSesionDto']

type AuthState = {
  /** Cambia al terminar una sesión o cambiar de cuenta, nunca al renovar tokens. */
  sessionRevision: number
  token: string | null
  usuario: UsuarioSesion | null
  logoutPendiente: boolean
  setSesion: (sesion: {
    accessToken: string
    usuario: UsuarioSesion
  }) => void
  /** Fusiona cambios parciales sobre el usuario de sesión (p. ej. perfil editado). */
  actualizarUsuario: (cambios: Partial<UsuarioSesion>) => void
  clearSesion: () => void
  solicitarCierreSesion: () => void
  confirmarCierreSesion: () => void
}

// Retirar credenciales guardadas por versiones anteriores; nunca rehidratarlas.
try { globalThis.localStorage?.removeItem('ribani-auth') } catch { /* Almacenamiento bloqueado. */ }

const LOGOUT_PENDING_KEY = 'ribani-logout-pending'
function leerCierrePendiente(): boolean {
  try { return globalThis.localStorage?.getItem(LOGOUT_PENDING_KEY) === '1' } catch { return false }
}
function guardarCierrePendiente(pendiente: boolean): void {
  try {
    if (pendiente) globalThis.localStorage?.setItem(LOGOUT_PENDING_KEY, '1')
    else globalThis.localStorage?.removeItem(LOGOUT_PENDING_KEY)
  } catch { /* Mantener al menos el estado en memoria cuando no hay almacenamiento. */ }
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  sessionRevision: 0,
  token: null,
  usuario: null,
  logoutPendiente: leerCierrePendiente(),
  setSesion: ({ accessToken, usuario }) => {
    const cambioDeCuenta = get().usuario?.id !== usuario.id
    set({
      token: accessToken, usuario, logoutPendiente: false,
      ...(cambioDeCuenta ? { sessionRevision: get().sessionRevision + 1 } : {}),
    })
    guardarCierrePendiente(false)
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
      token: null, usuario: null,
      sessionRevision: get().sessionRevision + 1,
    })
    // clear destruye y cancela las consultas, incluso las que siguen en vuelo.
    queryClient.clear()
  },
  solicitarCierreSesion: () => {
    guardarCierrePendiente(true)
    set({ logoutPendiente: true })
    get().clearSesion()
  },
  confirmarCierreSesion: () => {
    guardarCierrePendiente(false)
    set({ logoutPendiente: false })
  },
}))
