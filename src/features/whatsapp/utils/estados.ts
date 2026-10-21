import type { ResumenWhatsapp } from '../api/whatsapp.api'

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
