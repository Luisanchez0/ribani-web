import { useMutation } from '@tanstack/react-query'

import { authApi } from '../api/auth.api'
import { ROL_FAMILIAR_ENCARGADO } from '../types'
import type { DatosRegistro } from '../types'

/** Datos que el formulario de registro puede enviar. */
export type FormularioRegistro = Omit<DatosRegistro, 'rolCodigo'>

/**
 * Registro de familiar encargado. El rol `FAMILIAR_ENCARGADO` se fija aquí
 * y nunca se pide al usuario: el backend decide los roles que puede crear
 * el registro público.
 */
export function useRegistroFamiliar() {
  return useMutation({
    mutationFn: (datos: FormularioRegistro) =>
      authApi.register({ ...datos, rolCodigo: ROL_FAMILIAR_ENCARGADO }),
  })
}
