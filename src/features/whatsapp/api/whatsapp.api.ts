import { apiClient } from '@/lib/api-client'
import type { components } from '@/types/api'

type Schema = components['schemas']
export type Destinatario = Schema['DestinatarioWhatsappDto']
export type Preferencias = Schema['ConfiguracionWhatsappDto']
export type PreferenciasEntrada = Schema['PreferenciasWhatsappDto']
export type ResumenWhatsapp = Schema['ResumenAlertaWhatsappDto']

export const whatsappApi = {
  integracion: () =>
    apiClient
      .get<Schema['IntegracionWhatsappDto']>('/whatsapp/integracion')
      .then((r) => r.data),
  destinatarios: () =>
    apiClient
      .get<Destinatario[]>('/whatsapp/destinatarios')
      .then((r) => r.data),
  registrar: (body: Schema['RegistrarDestinatarioDto']) =>
    apiClient
      .post<Destinatario>('/whatsapp/destinatarios', body)
      .then((r) => r.data),
  consentimiento: (id: string, body: Schema['ConsentimientoWhatsappDto']) =>
    apiClient
      .patch<Destinatario>(`/whatsapp/destinatarios/${id}/consentimiento`, body)
      .then((r) => r.data),
  prueba: (id: string) =>
    apiClient
      .post<Schema['NotificacionWhatsappDto']>(
        `/whatsapp/destinatarios/${id}/prueba`,
      )
      .then((r) => r.data),
  historial: () =>
    apiClient
      .get<Schema['NotificacionWhatsappDto'][]>('/whatsapp/historial')
      .then((r) => r.data),
  resumen: () =>
    apiClient
      .get<ResumenWhatsapp[]>('/whatsapp/alertas/resumen')
      .then((r) => r.data),
  preferencias: (id: string) =>
    apiClient
      .get<Preferencias>(`/whatsapp/adultos/${id}/preferencias`)
      .then((r) => r.data),
  guardarPreferencias: (id: string, body: Schema['PreferenciasWhatsappDto']) =>
    apiClient
      .patch<Preferencias>(`/whatsapp/adultos/${id}/preferencias`, body)
      .then((r) => r.data),
}
