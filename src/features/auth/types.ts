import type { components } from '@/types/api'

export type CredencialesLogin = components['schemas']['LoginDto']


export type DatosRegistro = components['schemas']['RegisterDto']

export const ROL_FAMILIAR_ENCARGADO = 'FAMILIAR_ENCARGADO' as const

export type RespuestaTokens = components['schemas']['TokensWebRespuestaDto']

/** Variante de login cuando la cuenta tiene 2FA activado. */
export type RespuestaDesafioDosPasos = components['schemas']['DesafioDosPasosDto']

export type RespuestaLogin = RespuestaTokens | RespuestaDesafioDosPasos

export function esDesafioDosPasos(
  respuesta: RespuestaLogin,
): respuesta is RespuestaDesafioDosPasos {
  return 'twoFactorRequired' in respuesta
}

/**
 * POST /auth/2fa/setup — secreto TOTP nuevo (el backend lo guarda cifrado
 * en dos_factor_secret) y la URI otpauth para el QR del authenticator.
 */
export type ConfigDosPasos = components['schemas']['ConfigDosPasosDto']

/** POST /auth/2fa/verify y /auth/2fa/disable — respuesta del backend. */
export type RespuestaDosPasos = components['schemas']['EstadoDosPasosDto']
