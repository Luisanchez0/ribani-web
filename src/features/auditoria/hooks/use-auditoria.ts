import { useQuery } from '@tanstack/react-query'

import { auditoriaApi } from '../api/auditoria.api'
import type { FiltrosAuditoria } from '../types'

/** Claves de cache de la feature (convención de AGENTS.md). */
export const clavesAuditoria = {
  todos: ['auditoria'] as const,
  lista: (filtros?: FiltrosAuditoria) => ['auditoria', filtros ?? {}] as const,
}

export function useAuditoria(filtros?: FiltrosAuditoria) {
  return useQuery({
    queryKey: clavesAuditoria.lista(filtros),
    queryFn: () => auditoriaApi.listar(filtros),
    staleTime: 30_000,
  })
}
