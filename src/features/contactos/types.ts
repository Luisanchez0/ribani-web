
import type { components, operations } from '@/types/api'

export type Contacto = {
  id: string
  adulto_id: string
  nombre: string
  parentesco: string | null
  telefono: string
  email: string | null
  prioridad: number
  activo: boolean
  created_at: string
  updated_at: string
}

export type FiltrosContactos =
  operations['ContactosController_findAll']['parameters']['query']
  
export type CrearContacto = components['schemas']['CreateContactoDto']

export type ActualizarContacto = components['schemas']['UpdateContactoDto']
