import type { UsuarioSesion } from '@/stores/auth-store'

/**
 * Contrato actual del backend (ribani-server → AuthController/AuthService).
 *
 * TODO: reemplazar por los tipos generados en `src/types/api.d.ts` en
 * cuanto el backend esté corriendo y se regeneren. NO inventar endpoints
 * ni DTOs fuera de este contrato (ver AGENTS.md).
 */

/** POST /auth/login — body (LoginDto). */
export type CredencialesLogin = {
  email: string
  password: string
}

/** POST /auth/logout — body (RefreshTokenDto). */
export type RefrescoSesion = {
  refreshToken: string
}

/**
 * POST /auth/register — body (RegisterDto según /api-json).
 * El rol se asigna mediante `rolCodigo`; el registro público crea
 * únicamente el rol del familiar encargado (ver ROL_FAMILIAR_ENCARGADO).
 */
export type DatosRegistro = {
  nombre: string
  apellido: string
  email: string
  telefono: string
  password: string
  rolCodigo: string
}

/**
 * Código del rol asignado al registro público, según el catálogo de roles
 * del backend (ver seed de roles en ribani-server). No se pide al usuario:
 * el formulario de registro siempre envía este rol.
 */
export const ROL_FAMILIAR_ENCARGADO = 'FAMILIAR_ENCARGADO' as const

/** Respuesta al emitir tokens (AuthService.issueTokens). */
export type RespuestaTokens = {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: UsuarioSesion
}

/** Variante de login cuando la cuenta tiene 2FA activado. */
export type RespuestaDesafioDosPasos = {
  twoFactorRequired: true
  challengeToken: string
  expiresIn: number
}

export type RespuestaLogin = RespuestaTokens | RespuestaDesafioDosPasos

export function esDesafioDosPasos(
  respuesta: RespuestaLogin,
): respuesta is RespuestaDesafioDosPasos {
  return 'twoFactorRequired' in respuesta
}
