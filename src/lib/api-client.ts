import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'

import { env } from '@/config/env'
import { useAuthStore } from '@/stores/auth-store'
import type { components } from '@/types/api'

/**
 * Único cliente HTTP de la aplicación (ver AGENTS.md).
 * Los componentes nunca usan Axios directamente: solo este archivo y
 * la carpeta api de cada feature.
 *
 * Responsabilidades:
 * - baseURL y headers
 * - Authorization: Bearer <token>
 * - refresh de token una sola vez (single-flight) ante 401
 * - limpieza de sesión si el refresh falla
 */

/** Forma de la respuesta del backend al emitir tokens (auth.service.ts). */
type TokensEmitidos = components['schemas']['TokensWebRespuestaDto']

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
})

apiClient.interceptors.request.use((config) => {
  const { token, sessionRevision } = useAuthStore.getState()
  const request = config as RequestSesion
  request.ribaniRevision ??= sessionRevision
  if (request.ribaniRevision !== sessionRevision) {
    throw new axios.CanceledError('La sesión cambió antes de enviar la petición.')
  }

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }

  return config
}, (error: unknown) => { throw error }, { synchronous: true })

type RequestSesion = InternalAxiosRequestConfig & {
  ribaniRevision?: number
  ribaniReintentada?: boolean
}

let refreshEnCurso: { revision: number; promise: Promise<TokensEmitidos> } | null = null

async function refrescarTokens(): Promise<TokensEmitidos> {
  // Axios puro (sin interceptores) para no recursar sobre el propio refresh.
  const { data } = await axios.post<TokensEmitidos>(
    `${env.apiUrl}/auth/web/refresh`,
    {},
    { withCredentials: true, timeout: 15000 },
  )

  return data
}

function refreshCompartido(revision: number): Promise<TokensEmitidos> {
  if (!refreshEnCurso || refreshEnCurso.revision !== revision) {
    const promise = refrescarTokens()
    const actual = { revision, promise }
    refreshEnCurso = actual
    const liberar = () => { if (refreshEnCurso === actual) refreshEnCurso = null }
    void promise.then(liberar, liberar)
  }
  return refreshEnCurso.promise
}

/** El logout espera la rotación en vuelo para revocar la cookie más reciente. */
export async function esperarRefrescoSesion(): Promise<void> {
  try { await refreshEnCurso?.promise } catch { /* El logout también limpia una sesión vencida. */ }
}

/** Restaurar una recarga desde la cookie HttpOnly antes de montar las rutas. */
export async function restaurarSesion(): Promise<void> {
  const { sessionRevision, setSesion, clearSesion, logoutPendiente, confirmarCierreSesion } = useAuthStore.getState()
  if (logoutPendiente) {
    // Una salida sin red no debe convertirse en un nuevo login al recargar.
    try {
      await axios.post(`${env.apiUrl}/auth/web/logout`, {}, { withCredentials: true, timeout: 15000 })
      if (useAuthStore.getState().sessionRevision === sessionRevision) confirmarCierreSesion()
    } catch { /* Conservar la intención de salir hasta poder revocar la cookie. */ }
    return
  }
  try {
    const tokens = await refreshCompartido(sessionRevision)
    if (useAuthStore.getState().sessionRevision !== sessionRevision) return
    setSesion({ accessToken: tokens.accessToken, usuario: tokens.user })
  } catch {
    if (useAuthStore.getState().sessionRevision === sessionRevision) clearSesion()
  }
}

apiClient.interceptors.response.use(
  (response) => {
    const config = response.config as RequestSesion
    if (config.ribaniRevision !== useAuthStore.getState().sessionRevision) {
      throw new axios.CanceledError('La sesión cambió durante la petición.')
    }
    return response
  },
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      throw error
    }

    const config = error.config as RequestSesion | undefined
    const status = error.response?.status

    // Solo reintentar 401 de peticiones autenticadas, y una sola vez.
    if (
      status !== 401 ||
      !config ||
      config.ribaniReintentada ||
      (config.url?.startsWith('/auth/') && config.url !== '/auth/me') ||
      config.url === '/usuarios/perfil/password' ||
      /^\/usuarios\/[^/]+\/2fa\/verify$/.test(config.url ?? '')
    ) {
      throw error
    }

    const { token, setSesion, clearSesion, sessionRevision } =
      useAuthStore.getState()

    // Una petición de la sesión anterior no puede renovar ni cerrar la actual.
    if (config.ribaniRevision !== sessionRevision) throw error

    if (!token) {
      clearSesion()
      throw error
    }

    try {
      // Single-flight: ante varios 401 concurrentes, se refresca una sola vez.
      const tokens = await refreshCompartido(sessionRevision)
      if (useAuthStore.getState().sessionRevision !== sessionRevision) throw error

      setSesion({
        accessToken: tokens.accessToken,
        usuario: tokens.user,
      })

      config.ribaniReintentada = true
      config.headers.set('Authorization', `Bearer ${tokens.accessToken}`)

      return await apiClient(config)
    } catch {
      if (useAuthStore.getState().sessionRevision === sessionRevision) clearSesion()
      throw error
    }
  },
)
