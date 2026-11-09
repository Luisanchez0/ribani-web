import type { Alerta } from '@/features/alertas'

const prioridad: Record<Alerta['severidad'], number> = { CRITICA: 0, ALTA: 1, MEDIA: 2, BAJA: 3 }

/** Organiza la presentación de pendientes sin modificar los datos del cache. */
export function resumirAlertasPendientes(alertas: Alerta[]) {
  const unicas = [...new Map(alertas.map(alerta => [alerta.id, alerta])).values()]
  const pendientes = unicas.filter(a => a.estado === 'ABIERTA' || a.estado === 'EN_ATENCION')
  return {
    abiertas: pendientes.filter(a => a.estado === 'ABIERTA').length,
    enAtencion: pendientes.filter(a => a.estado === 'EN_ATENCION').length,
    criticas: pendientes.filter(a => a.severidad === 'CRITICA').length,
    prioritarias: pendientes.toSorted((a, b) => prioridad[a.severidad] - prioridad[b.severidad]
      || Date.parse(a.ocurrida_en) - Date.parse(b.ocurrida_en)).slice(0, 6),
  }
}

export function contarListado(cantidad: number, limite: number, consultados = cantidad): string {
  return `${cantidad}${consultados >= limite ? '+' : ''}`
}
