import { apiClient } from '@/lib/api-client'

import type { EventoAuditoria, FiltrosAuditoria } from '../types'


export const auditoriaApi = {
  listar(filtros?: FiltrosAuditoria): Promise<EventoAuditoria[]> {
    return apiClient
      .get<EventoAuditoria[]>('/auditoria', { params: filtros })
      .then((response) => response.data)
  },
}
