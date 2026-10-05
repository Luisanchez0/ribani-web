import { apiClient } from '@/lib/api-client'

import type {
  CredencialesLogin,
  DatosRegistro,
  RefrescoSesion,
  RespuestaLogin,
} from '../types'

/**
 * Endpoints reales del backend (ribani-server/src/auth/auth.controller.ts):
 * - POST /auth/login
 * - POST /auth/logout
 * - POST /auth/register
 *
 * Pendiente de implementar en el flujo de UI:
 * - POST /auth/2fa/login (challengeToken + code) cuando la cuenta usa 2FA
 */
export const authApi = {
  login(credenciales: CredencialesLogin): Promise<RespuestaLogin> {
    return apiClient
      .post<RespuestaLogin>('/auth/login', credenciales)
      .then((response) => response.data)
  },

  logout(refresco: RefrescoSesion): Promise<void> {
    return apiClient
      .post<void>('/auth/logout', refresco)
      .then(() => undefined)
  },

  /**
   * Registro público de cuenta. La respuesta aún no se consume en la UI;
   * tipar aquí la forma real cuando se regenere `src/types/api.d.ts`
   * (no inventar el contrato, ver AGENTS.md).
   */
  register(datos: DatosRegistro): Promise<unknown> {
    return apiClient
      .post<unknown>('/auth/register', datos)
      .then((response) => response.data)
  },
}
