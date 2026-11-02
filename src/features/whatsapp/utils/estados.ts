import type { ResumenWhatsapp } from '../api/whatsapp.api'
import type { components } from '@/types/api'

type Mensaje = components['schemas']['NotificacionWhatsappDto']

function normalizarTexto(valor: string) {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim()
}

/** Filtros locales sobre los últimos mensajes cargados; no alteran la caché. */
export function filtrarHistorialWhatsapp<T extends Pick<Mensaje, 'destinatario_id' | 'estado' | 'tipo'>>(
  mensajes: T[],
  busqueda: string,
  estado: string,
  nombres: Map<string, string>,
): T[] {
  const texto = normalizarTexto(busqueda)
  return mensajes.filter(
    (mensaje) =>
      (!estado || mensaje.estado === estado) &&
      (!texto ||
        normalizarTexto(
          `${nombres.get(mensaje.destinatario_id) ?? ''} ${mensaje.tipo}`,
        ).includes(texto)),
  )
}

export function etiquetaWhatsapp(estado: string): string {
  const etiquetas: Record<string, string> = {
    EN_COLA: 'En cola',
    PROCESANDO: 'Procesando',
    ENVIADA: 'Aceptada por Meta',
    ENTREGADA: 'Entregada',
    LEIDA: 'Leída',
    FALLIDA: 'Fallida',
    CANCELADA: 'Cancelada',
  }
  return etiquetas[estado] ?? estado
}
export function resumirWhatsapp(
  filas: ResumenWhatsapp[] | undefined,
  alertaId: string,
): string {
  if (!filas) return 'Sin datos'
  const grupos = filas.filter((f) => f.alerta_id === alertaId)
  return grupos.length
    ? grupos
        .map((g) => `${etiquetaWhatsapp(g.estado)}: ${g.cantidad}`)
        .join(' · ')
    : 'Sin envíos'
}
