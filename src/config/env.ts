/**
 * Única salida permitida para variables de entorno (ver AGENTS.md).
 * Fuera de este archivo está prohibido leer `import.meta.env` directamente.
 *
 * Las variables VITE_* son públicas: nunca colocar secretos aquí.
 */

function readApiUrl(): string {
  const url = import.meta.env.VITE_API_URL

  return url && url.trim().length > 0 ? url.trim() : 'http://localhost:3000'
}

export const env = {
  apiUrl: readApiUrl(),
} as const
