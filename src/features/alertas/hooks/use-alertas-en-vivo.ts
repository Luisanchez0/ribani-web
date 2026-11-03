import { createContext, useContext } from 'react'

import type { EstadoPanelAlertas } from './use-alertas-stream'

/**
 * Estado de la conexión SSE de alertas que mantiene el Shell
 * (AvisosAlertasProvider). Las páginas lo leen en lugar de abrir su
 * propio stream, así no se duplican conexiones por adulto.
 */
export const AlertasEnVivoContext = createContext<EstadoPanelAlertas>('desconectado')

export function useAlertasEnVivo(): EstadoPanelAlertas {
  return useContext(AlertasEnVivoContext)
}
