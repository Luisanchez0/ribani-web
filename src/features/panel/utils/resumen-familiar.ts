import type { Alerta } from '@/features/alertas'
import type { AdultoVinculado } from '@/features/familiares'

import { resumirAlertasPendientes } from './resumen-admin'

/** /familiares/mis-adultos usa el límite predeterminado de 100 vínculos. */
export function resumirVinculosFamiliares(adultos: AdultoVinculado[]) {
  return { activos: adultos.filter(adulto => adulto.estado === 'ACTIVA'), limitado: adultos.length >= 100 }
}

export function resumirAlertasFamiliares(adultos: AdultoVinculado[], alertas: Alerta[]) {
  const ids = new Set(adultos.filter(adulto => adulto.estado === 'ACTIVA').map(adulto => adulto.id))
  return resumirAlertasPendientes(alertas.filter(alerta => ids.has(alerta.adulto_id)))
}
