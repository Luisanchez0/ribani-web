import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'

import { env } from '@/config/env'
import { useAuthStore, type UsuarioSesion } from '@/stores/auth-store'

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
type TokensEmitidos = {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: UsuarioSesion
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }

  return config
})

/** Requests que ya se reintentaron tras un refresh (evitar bucles). */
const reintentadas = new WeakSet<InternalAxiosRequestConfig>()

let refreshEnCurso: Promise<TokensEmitidos> | null = null

async function refrescarTokens(refreshToken: string): Promise<TokensEmitidos> {
  // Axios puro (sin interceptores) para no recursar sobre el propio refresh.
  const { data } = await axios.post<TokensEmitidos>(
    `${env.apiUrl}/auth/refresh`,
    { refreshToken },
  )

  return data
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      throw error
    }

    const config = error.config
    const status = error.response?.status

    // Solo reintentar 401 de peticiones autenticadas, y una sola vez.
    if (
      status !== 401 ||
      !config ||
      reintentadas.has(config) ||
      config.url?.includes('/auth/')
    ) {
      throw error
    }

    const { refreshToken, setSesion, clearSesion } =
      useAuthStore.getState()

    if (!refreshToken) {
      clearSesion()
      throw error
    }

    try {
      // Single-flight: ante varios 401 concurrentes, se refresca una sola vez.
      refreshEnCurso ??= refrescarTokens(refreshToken).finally(() => {
        refreshEnCurso = null
      })

      const tokens = await refreshEnCurso

      setSesion({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        usuario: tokens.user,
      })

      reintentadas.add(config)
      config.headers.set('Authorization', `Bearer ${tokens.accessToken}`)

      return await apiClient(config)
    } catch {
      clearSesion()
      throw error
    }
  },
)
