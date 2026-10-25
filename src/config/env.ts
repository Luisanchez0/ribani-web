/**
 * Única salida permitida para variables de entorno (ver AGENTS.md).
 * Fuera de este archivo está prohibido leer `import.meta.env` directamente.
 *
 * Las variables VITE_* son públicas: nunca colocar secretos aquí.
 */

export function resolveApiUrl(url: string | undefined, production: boolean): string {
  const apiUrl = url?.trim() || 'http://localhost:3000'
  if (production) {
    let valid = false
    try { valid = new URL(apiUrl).protocol === 'https:' } catch { /* URL inválida. */ }
    if (!valid) throw new Error('VITE_API_URL debe ser una URL HTTPS en producción.')
  }
  return apiUrl
}

export const env = {
  apiUrl: resolveApiUrl(import.meta.env.VITE_API_URL, import.meta.env.PROD),
} as const
