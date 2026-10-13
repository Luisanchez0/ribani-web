
import type { components, operations } from '@/types/api'

/**
 * Contrato real de lo que devuelve ribani-server
 * (SELECT_DISPOSITIVO en dispositivos.service.ts):
 *
 *   id, usuario_id, nombre, plataforma, version_app,
 *   ultimo_contacto_en, activo, created_at, updated_at
 *
 * Nota: el backend no expone `identificador` ni `push_token` en lecturas
 * (por privacidad solo guarda el hash del identificador y nunca devuelve
 * el token). El campo real es `ultimo_contacto_en`; el alias
 * `ultimo_latido_en` se conserva para no romper consumidores.
 */
export type Dispositivo = {
  id: string
  usuario_id: string
  nombre: string
  plataforma: 'ANDROID' | 'IOS' | 'WEB'
  version_app: string | null
  /** Alias legible del `ultimo_contacto_en` real del backend. */
  ultimo_latido_en: string | null
  ultimo_contacto_en: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

/** Adaptador defensivo: normaliza respuestas del backend al tipo de la UI. */
export function normalizarDispositivo(
  crudo: Record<string, unknown>,
): Dispositivo {
  const latido =
    (crudo['ultimo_contacto_en'] as string | null | undefined) ??
    (crudo['ultimo_latido_en'] as string | null | undefined) ??
    null

  return {
    id: crudo['id'] as string,
    usuario_id: (crudo['usuario_id'] as string | undefined) ?? '',
    nombre: crudo['nombre'] as string,
    plataforma: crudo['plataforma'] as Dispositivo['plataforma'],
    version_app: (crudo['version_app'] as string | null | undefined) ?? null,
    ultimo_latido_en: latido,
    ultimo_contacto_en:
      (crudo['ultimo_contacto_en'] as string | null | undefined) ?? null,
    activo: Boolean(crudo['activo']),
    created_at: crudo['created_at'] as string,
    updated_at: crudo['updated_at'] as string,
  }
}

/** GET /dispositivos — filtros de query soportados por el backend. */
export type FiltrosDispositivos =
  operations['DispositivosController_listar']['parameters']['query']

/** POST /dispositivos — body (CreateDispositivoDto). */
export type CrearDispositivo = components['schemas']['CreateDispositivoDto']

/** PATCH /dispositivos/{id} — body (UpdateDispositivoDto). */
export type ActualizarDispositivo = components['schemas']['UpdateDispositivoDto']
