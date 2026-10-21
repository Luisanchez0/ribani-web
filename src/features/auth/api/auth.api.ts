import { apiClient } from '@/lib/api-client'

import type {
  CredencialesLogin,
  ConfigDosPasos,
  DatosRegistro,
  RefrescoSesion,
  RespuestaLogin,
  RespuestaDosPasos,
  RespuestaTokens,
} from '../types'


export const authApi = {
  login(credenciales: CredencialesLogin): Promise<RespuestaLogin> {
    return apiClient
      .post<RespuestaLogin>('/auth/login', credenciales)
      .then((response) => response.data)
  },

  /**
   * POST /auth/2fa/login — segundo paso del login con 2FA: valida el
   * código TOTP contra el challengeToken devuelto por /auth/login
   * (TwoFactorLoginDto) y emite los tokens definitivos.
   */
  loginDosPasos(challengeToken: string, code: string): Promise<RespuestaTokens> {
    return apiClient
      .post<RespuestaTokens>('/auth/2fa/login', { challengeToken, code })
      .then((response) => response.data)
  },

  logout(refresco: RefrescoSesion): Promise<void> {
    return apiClient
      .post<void>('/auth/logout', refresco)
      .then(() => undefined)
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
