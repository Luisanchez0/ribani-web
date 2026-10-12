import { useQuery } from '@tanstack/react-query'

import { listarMisAdultos } from '@/lib/adultos'

/** Clave de cache compartida (rodeo ninguna otra feature todavía). */
export const clavesAdultos = ['adultos', 'mis-adultos'] as const


export function useAdultosVinculados() {
  return useQuery({
    queryKey: clavesAdultos,
    queryFn: listarMisAdultos,
  })
}
