import { apiClient } from '@/lib/api-client'
import type { AdultoVinculado } from '@/features/familiares'

/**
 * GET /familiares/mis-adultos — adultos mayores vinculados al usuario
 * autenticado (FamiliaresController.misAdultos).
 *
 * El backend devuelve el shape anidado de Prisma: el vínculo con el
 * adulto dentro de usuarios_adulto_familiares_adulto_idTousuarios
 * (con ADMINISTRADOR devuelve pseudo-vínculos planos). Se normaliza
 * aquí a la forma plana que consumen los formularios, igual que hace
 * familiares.api.misAdultos().
 */
export type { AdultoVinculado }

type RespuestaAnidada = {
  id: string
  estado: 'ACTIVA' | 'PENDIENTE' | 'REVOCADA'
  parentesco: string | null
  es_contacto_principal: boolean
  puede_ver_ubicacion: boolean
  puede_gestionar_medicamentos: boolean
  /** Anidada cuando el rol es FAMILIAR_ENCARGADO; null/ausente en admin. */
  usuarios_adulto_familiares_adulto_idTousuarios?: {
    id: string
    nombre: string
    apellido: string
    email: string
    telefono: string | null
    activo: boolean
  } | null
  /** Shape plano cuando el rol es ADMINISTRADOR. */
  vinculo_id?: string
  nombre?: string
  apellido?: string
  email?: string
}

export function listarMisAdultos(): Promise<AdultoVinculado[]> {
  return apiClient
    .get<RespuestaAnidada[]>('/familiares/mis-adultos')
    .then((response) =>
      response.data.map((vinculo) => {
        const persona = vinculo.usuarios_adulto_familiares_adulto_idTousuarios

        // Shape plano (admin): los datos ya están al primer nivel.
        if (!persona && vinculo.nombre && vinculo.id) {
          return {
            id: vinculo.id,
            vinculo_id: vinculo.vinculo_id ?? '',
            nombre: vinculo.nombre,
            apellido: vinculo.apellido ?? '',
            email: vinculo.email ?? '',
            parentesco: vinculo.parentesco,
            es_contacto_principal: vinculo.es_contacto_principal,
            puede_ver_ubicacion: vinculo.puede_ver_ubicacion,
            puede_gestionar_medicamentos: vinculo.puede_gestionar_medicamentos,
            estado: vinculo.estado,
          }
        }

        // Shape anidado (familiar encargado): extraer la contraparte.
        if (!persona) {
          throw new Error('Respuesta de mis-adultos sin datos del adulto.')
        }

        return {
          id: persona.id,
          vinculo_id: vinculo.id,
          nombre: persona.nombre,
          apellido: persona.apellido,
          email: persona.email,
          parentesco: vinculo.parentesco,
          es_contacto_principal: vinculo.es_contacto_principal,
          puede_ver_ubicacion: vinculo.puede_ver_ubicacion,
          puede_gestionar_medicamentos: vinculo.puede_gestionar_medicamentos,
          estado: vinculo.estado,
        }
      }),
    )
}
