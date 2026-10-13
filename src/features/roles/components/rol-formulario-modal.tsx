import { useState } from 'react'
import type { FormEvent } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useActualizarRol } from '../hooks'
import type { RolLista } from '../types'

type RolFormularioModalProps = {
  abierto: boolean
  rol: RolLista | null
  onCerrar: () => void
}


export function RolFormularioModal({
  abierto,
  rol,
  onCerrar,
}: RolFormularioModalProps) {
  const actualizar = useActualizarRol()

  const [nombre, setNombre] = useState(rol?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(rol?.descripcion ?? '')
  const [activo, setActivo] = useState(rol?.activo ?? true)

  if (!abierto) return null

  function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    if (!rol) return

    actualizar.mutate(
      {
        id: rol.id,
        datos: {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || undefined,
          activo,
        },
      },
      { onSuccess: onCerrar },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar formulario"
        className="absolute inset-0 cursor-default bg-pino-950/60"
        onClick={onCerrar}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-rol-modal"
        className="relative w-full max-w-md rounded-lg border border-salvia-200 bg-white p-6 shadow-lg"
      >
        <h2
          id="titulo-rol-modal"
          className="font-display text-lg font-semibold text-pino-900"
        >
          Editar rol
        </h2>
        <p className="mt-1 text-sm/6 text-salvia-700">
          Ajusta el nombre, la descripción y el estado del rol{' '}
          <span className="font-medium text-pino-900">{rol?.nombre}</span>.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label
              htmlFor="rol-nombre"
              className="block text-sm font-medium text-pino-900"
            >
              Nombre
            </label>
            <Input
              id="rol-nombre"
              required
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="rol-descripcion"
              className="block text-sm font-medium text-pino-900"
            >
              Descripción{' '}
              <span className="text-salvia-500">(opcional)</span>
            </label>
            <Input
              id="rol-descripcion"
              value={descripcion}
              onChange={(evento) => setDescripcion(evento.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="rol-activo"
              type="checkbox"
              className="h-4 w-4 rounded border-salvia-300 text-pino-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600"
              checked={activo}
              onChange={(evento) => setActivo(evento.target.checked)}
            />
            <label htmlFor="rol-activo" className="text-sm text-pino-900">
              Rol activo
            </label>
          </div>

          {actualizar.isError && (
            <Alert variant="error">
              No se pudieron guardar los cambios. Revisa los datos e intenta de
              nuevo.
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={onCerrar}
              disabled={actualizar.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={actualizar.isPending}>
              {actualizar.isPending ? (
                <Spinner size="sm" label="Guardando cambios…" />
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
