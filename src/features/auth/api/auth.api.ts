import { apiClient, esperarRefrescoSesion } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'

import type {
  CredencialesLogin,
  ConfigDosPasos,
  DatosRegistro,
  RespuestaLogin,
  RespuestaDosPasos,
  RespuestaTokens,
} from '../types'
let logoutEnCurso: Promise<void> | null = null

export const authApi = {
  async login(credenciales: CredencialesLogin): Promise<RespuestaLogin> {
    await logoutEnCurso?.catch(() => undefined)
    return apiClient
      .post<RespuestaLogin>('/auth/web/login', credenciales, { withCredentials: true })
      .then((response) => response.data)
  },

  /**
   * POST /auth/2fa/login — segundo paso del login con 2FA: valida el
   * código TOTP contra el challengeToken devuelto por /auth/login
   * (TwoFactorLoginDto) y emite los tokens definitivos.
   */
  async loginDosPasos(challengeToken: string, code: string): Promise<RespuestaTokens> {
    await logoutEnCurso?.catch(() => undefined)
    return apiClient
      .post<RespuestaTokens>('/auth/web/2fa/login', { challengeToken, code }, { withCredentials: true })
      .then((response) => response.data)
  },

  logout(): Promise<void> {
    if (logoutEnCurso) return logoutEnCurso
    const revision = useAuthStore.getState().sessionRevision
    const promise = (async () => {
      await esperarRefrescoSesion()
      await apiClient.post('/auth/web/logout', {}, { withCredentials: true, timeout: 15000 })
      if (useAuthStore.getState().sessionRevision === revision) useAuthStore.getState().confirmarCierreSesion()
    })()
    logoutEnCurso = promise
    const liberar = () => { if (logoutEnCurso === promise) logoutEnCurso = null }
    void promise.then(liberar, liberar)
    return promise
  },

  register(datos: DatosRegistro): Promise<unknown> {
    return apiClient
      .post<unknown>('/auth/register', datos)
      .then((response) => response.data)
  },

  /**
   * POST /auth/2fa/setup — genera el secreto TOTP de la CUENTA CON SESIÓN
   * y devuelve la URI otpauth que se renderiza como QR en la página.
   */
  setupDosPasos(): Promise<ConfigDosPasos> {
    return apiClient
      .post<ConfigDosPasos>('/auth/2fa/setup')
      .then((response) => response.data)
  },

  /** POST /auth/2fa/verify — valida el código y activa el 2FA propio. */
  confirmarDosPasos(code: string): Promise<RespuestaDosPasos> {
    return apiClient
      .post<RespuestaDosPasos>('/auth/2fa/verify', { code })
      .then((response) => response.data)
  },

  /** POST /auth/2fa/disable — desactiva el 2FA propio (pide contraseña). */
  desactivarDosPasos(password: string): Promise<RespuestaDosPasos> {
    return apiClient
      .post<RespuestaDosPasos>('/auth/2fa/disable', { password })
      .then((response) => response.data)
  },

  /**
   * POST /auth/forgot-password — solicita el código de recuperación.
   * El backend responde con un mensaje genérico (no revela si el correo
   * existe); el código llega por correo y caduca en 10 minutos.
   */
  solicitarReset(email: string): Promise<{ mensaje: string }> {
    return apiClient
      .post<{ mensaje: string }>('/auth/forgot-password', { email })
      .then((response) => response.data)
  },

  /**
   * POST /auth/reset-password — cambia la contraseña con el código
   * de 6 dígitos recibido por correo.
   */
  resetPassword(payload: {
    email: string
    codigo: string
    password: string
  }): Promise<{ mensaje: string }> {
    return apiClient
      .post<{ mensaje: string }>('/auth/reset-password', payload)
      .then((response) => response.data)
  },
}
