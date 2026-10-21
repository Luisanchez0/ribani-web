import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { whatsappApi } from '../api/whatsapp.api'

export function useWhatsapp() {
  const queryClient = useQueryClient()
  const integracion = useQuery({
    queryKey: ['whatsapp', 'integracion'],
    queryFn: whatsappApi.integracion,
  })
  const destinatarios = useQuery({
    queryKey: ['whatsapp', 'destinatarios'],
    queryFn: whatsappApi.destinatarios,
  })
  const historial = useQuery({
    queryKey: ['whatsapp', 'historial'],
    queryFn: whatsappApi.historial,
    refetchInterval: 15_000,
  })
  const accion = useMutation({
    mutationFn: (operacion: () => Promise<unknown>) => operacion(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whatsapp'] }),
  })
  return { integracion, destinatarios, historial, accion }
}
export function useResumenWhatsapp() {
  return useQuery({
    queryKey: ['whatsapp', 'resumen'],
    queryFn: whatsappApi.resumen,
    refetchInterval: 15_000,
  })
}
export function usePreferenciasWhatsapp(id: string) {
  const queryClient = useQueryClient()
  const consulta = useQuery({
    queryKey: ['whatsapp', 'preferencias', id],
    queryFn: () => whatsappApi.preferencias(id),
    enabled: Boolean(id),
  })
  const guardar = useMutation({
    mutationFn: (body: Parameters<typeof whatsappApi.guardarPreferencias>[1]) =>
      whatsappApi.guardarPreferencias(id, body),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['whatsapp', 'preferencias', id],
      }),
  })
  return { consulta, guardar }
}
