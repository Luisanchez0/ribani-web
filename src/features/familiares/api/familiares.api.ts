import { apiClient } from '@/lib/api-client'
import type { components } from '@/types/api'

import type {
  ActualizarVinculo,
  AdultoVinculado,
  AdultoVinculadoRespuesta,
  CompletarInvitacion,
  CrearInvitacion,
  CrearVinculo,
  FamiliarVinculado,
  FamiliarVinculadoRespuesta,
  InvitacionPendiente,
  InvitacionPendienteRespuesta,
  VinculoAdmin,
  VinculoAdminRespuesta,
  VinculoFamiliar,
} from '../types'

/**
 * Endpoints reales del backend (ribani-server):
 * - GET    /familiares
 * - POST   /familiares
 * - GET    /familiares/mis-adultos              (adultos del usuario con sesión)
 * - GET    /familiares/mis-familiares           (familiares del adulto del usuario con sesión)
 * - GET    /familiares/{id}
 * - PATCH  /familiares/{id}
 * - DELETE /familiares/{id}
 * - POST   /familiares/invitaciones             (invitar cuidador)
 * - POST   /familiares/invitaciones/completar   (completar registro desde invitación)
 * - POST   /familiares/invitaciones/{id}/aceptar
 * - POST   /familiares/invitaciones/{id}/rechazar
 * - GET    /familiares/invitaciones/pendientes  (invitaciones dirigidas al usuario con sesión)
 * - POST   /usuarios/{id}/2fa/setup             (2FA asistido: QR para el adulto)
 * - POST   /usuarios/{id}/2fa/verify            (2FA asistido: confirmar código)
 *
 * Los listados del backend traen a la contraparte anidada en una relación
 * de Prisma; se mapea aquí a la forma plana que consume la UI para que los
 * componentes no dependan de nombres internos del ORM.
 */

/**
 * POST /usuarios/{id}/2fa/setup — respuesta del backend (setupTwoFactorForUser).
 * `otpauthUrl` se renderiza como QR para que el adulto lo escanee con su
 * app authenticator; `secret` se ofrece como texto de respaldo.
 */
export type SetupDosPasos = components['schemas']['ConfigDosPasosDto']


export type ConfirmarDosPasosBody = components['schemas']['VerifyTwoFactorDto']
const mapearPersona = (
  usuario: VinculoAdminRespuesta['usuarios_adulto_familiares_familiar_idTousuarios'],
) => ({
  id: usuario.id,
  nombre: usuario.nombre,
  apellido: usuario.apellido,
  email: usuario.email,
})

const mapearAdultoVinculado = (vinculo: AdultoVinculadoRespuesta): AdultoVinculado => {
  const adulto = vinculo.usuarios_adulto_familiares_adulto_idTousuarios

  return {
    id: adulto.id,
    vinculo_id: vinculo.id,
    nombre: adulto.nombre,
    apellido: adulto.apellido,
    email: adulto.email,
    parentesco: vinculo.parentesco,
    es_contacto_principal: vinculo.es_contacto_principal,
    puede_ver_ubicacion: vinculo.puede_ver_ubicacion,
    puede_gestionar_medicamentos: vinculo.puede_gestionar_medicamentos,
    estado: vinculo.estado,
  }
}

const mapearFamiliarVinculado = (vinculo: FamiliarVinculadoRespuesta): FamiliarVinculado => {
  const familiar = vinculo.usuarios_adulto_familiares_familiar_idTousuarios

  return {
    id: familiar.id,
    vinculo_id: vinculo.id,
    nombre: familiar.nombre,
    apellido: familiar.apellido,
    email: familiar.email,
    parentesco: vinculo.parentesco,
    es_contacto_principal: vinculo.es_contacto_principal,
    puede_ver_ubicacion: vinculo.puede_ver_ubicacion,
    puede_gestionar_medicamentos: vinculo.puede_gestionar_medicamentos,
    estado: vinculo.estado,
  }
}

const mapearInvitacionPendiente = (vinculo: InvitacionPendienteRespuesta): InvitacionPendiente => {
  const familiar = vinculo.usuarios_adulto_familiares_familiar_idTousuarios

  return {
    id: vinculo.id,
    vinculo_id: vinculo.id,
    familiar_nombre: familiar.nombre,
    familiar_apellido: familiar.apellido,
    familiar_email: familiar.email,
    parentesco: vinculo.parentesco,
    created_at: vinculo.created_at,
  }
}

export const familiaresApi = {
  /**
   * Con sesión de ADMINISTRADOR, el backend incluye ambas contrapartes;
   * se mapean a la forma plana para la tabla admin de vínculos.
   */
  listar(): Promise<VinculoAdmin[]> {
    return apiClient
      .get<VinculoAdminRespuesta[]>('/familiares')
      .then((response) =>
        response.data.map((vinculo) => ({
          id: vinculo.id,
          familiar: mapearPersona(vinculo.usuarios_adulto_familiares_familiar_idTousuarios),
          adulto: mapearPersona(vinculo.usuarios_adulto_familiares_adulto_idTousuarios),
          parentesco: vinculo.parentesco,
          es_contacto_principal: vinculo.es_contacto_principal,
          puede_ver_ubicacion: vinculo.puede_ver_ubicacion,
          puede_gestionar_medicamentos: vinculo.puede_gestionar_medicamentos,
          estado: vinculo.estado,
        })),
      )
  },

  vincular(datos: CrearVinculo): Promise<void> {
    return apiClient
      .post('/familiares', datos)
      .then(() => undefined)
  },

  misAdultos(): Promise<AdultoVinculado[]> {
    return apiClient
      .get<AdultoVinculadoRespuesta[]>('/familiares/mis-adultos')
      .then((response) => response.data.map(mapearAdultoVinculado))
  },

  misFamiliares(): Promise<FamiliarVinculado[]> {
    return apiClient
      .get<FamiliarVinculadoRespuesta[]>('/familiares/mis-familiares')
      .then((response) => response.data.map(mapearFamiliarVinculado))
  },

  obtener(id: string): Promise<VinculoFamiliar> {
    return apiClient
      .get<VinculoFamiliar>(`/familiares/${id}`)
      .then((response) => response.data)
  },

  actualizar(id: string, datos: ActualizarVinculo): Promise<void> {
    return apiClient
      .patch(`/familiares/${id}`, datos)
      .then(() => undefined)
  },

  /** DELETE /familiares/{id} — revoca/elimina el vínculo (sin body). */
  desvincular(id: string): Promise<void> {
    return apiClient
      .delete(`/familiares/${id}`)
      .then(() => undefined)
  },

  invitar(datos: CrearInvitacion): Promise<void> {
    return apiClient
      .post('/familiares/invitaciones', datos)
      .then(() => undefined)
  },

  completarInvitacion(datos: CompletarInvitacion): Promise<void> {
    return apiClient
      .post('/familiares/invitaciones/completar', datos)
      .then(() => undefined)
  },

  aceptarInvitacion(id: string): Promise<void> {
    return apiClient
      .post(`/familiares/invitaciones/${id}/aceptar`)
      .then(() => undefined)
  },

  rechazarInvitacion(id: string): Promise<void> {
    return apiClient
      .post(`/familiares/invitaciones/${id}/rechazar`)
      .then(() => undefined)
  },

  invitacionesPendientes(): Promise<InvitacionPendiente[]> {
    return apiClient
      .get<InvitacionPendienteRespuesta[]>('/familiares/invitaciones/pendientes')
      .then((response) => response.data.map(mapearInvitacionPendiente))
  },

  /**
   * 2FA asistido (rol FAMILIAR_ENCARGADO con vínculo ACTIVA, o admin):
   * setup genera un secreto nuevo para el adulto y devuelve la URI
   * otpauth; verify confirma el código TOTP y activa el 2FA.
   */
  setupDosPasos(adultoId: string): Promise<SetupDosPasos> {
    return apiClient
      .post<SetupDosPasos>(`/usuarios/${adultoId}/2fa/setup`)
      .then((response) => response.data)
  },

  confirmarDosPasos(adultoId: string, code: string): Promise<void> {
    return apiClient
      .post(`/usuarios/${adultoId}/2fa/verify`, { code } satisfies ConfirmarDosPasosBody)
      .then(() => undefined)
  },
}
