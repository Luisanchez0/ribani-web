import { useMutation } from '@tanstack/react-query'

import { authApi } from '../api/auth.api'
import { ROL_FAMILIAR_ENCARGADO } from '../types'
import type { DatosRegistro } from '../types'

export type FormularioRegistro = Omit<DatosRegistro, 'rolCodigo'>


export function useRegistroFamiliar() {
  return useMutation({
    mutationFn: (datos: FormularioRegistro) =>
      authApi.register({ ...datos, rolCodigo: ROL_FAMILIAR_ENCARGADO }),
  })
}
