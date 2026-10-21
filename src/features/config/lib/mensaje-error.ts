import { isAxiosError } from 'axios'

/** Traduce errores HTTP del backend a mensajes comprensibles (ver AGENTS.md). */
export function mensajeDeError(error: unknown): string {
  if (isAxiosError(error)) {
    const data: unknown = error.response?.data

    if (
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string'
    ) {
      return data.message
    }
  }

  return 'No se pudo completar la operación. Intenta de nuevo.'
}
