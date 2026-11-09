import type { Alerta, TransicionAlerta } from '../api/alertas.api'

const acciones: { estado: TransicionAlerta['estado']; etiqueta: string }[] = [
  { estado: 'EN_ATENCION', etiqueta: 'Atender' },
  { estado: 'RESUELTA', etiqueta: 'Resolver' },
  { estado: 'CANCELADA', etiqueta: 'Cancelar' },
]

export function accionesDisponibles(estado: Alerta['estado']) {
  if (estado === 'ABIERTA') return acciones
  if (estado === 'EN_ATENCION') return acciones.slice(1)
  return []
}
