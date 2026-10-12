import type { UsuarioSesion } from '@/stores/auth-store'

export type CredencialesLogin = {
  email: string
  password: string
}

export type RefrescoSesion = {
  refreshToken: string
}


export type DatosRegistro = {
  nombre: string
  apellido: string
  email: string
  telefono: string
  password: string
  rolCodigo: string
}

export const ROL_FAMILIAR_ENCARGADO = 'FAMILIAR_ENCARGADO' as const

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
