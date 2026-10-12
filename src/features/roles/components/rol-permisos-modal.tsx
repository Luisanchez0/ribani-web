import { useState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useAsignarPermisos, usePermisos } from '../hooks'
import type { Permiso, RolLista } from '../types'

type RolPermisosModalProps = {
  abierto: boolean
  rol: RolLista | null
  onCerrar: () => void
}

export function RolPermisosModal({
  abierto,
  rol,
  onCerrar,
}: RolPermisosModalProps) {
  const asignar = useAsignarPermisos()
  const permisos = usePermisos()

  const [marcados, setMarcados] = useState<Set<string>>(
    () => new Set(rol?.permisos.map((permiso) => permiso.id) ?? []),
  )

  if (!abierto) return null

  function alternar(idPermiso: string) {
    setMarcados((actual) => {
      const nuevo = new Set(actual)
      if (nuevo.has(idPermiso)) {
        nuevo.delete(idPermiso)
      } else {
        nuevo.add(idPermiso)
      }
      return nuevo
    })
  }

  function handleSubmit() {
    if (!rol) return

    asignar.mutate(
      { id: rol.id, datos: { permisos: [...marcados] } },
      { onSuccess: onCerrar },
    )
  }

  const permisosPorRecurso = new Map<string, {
    recurso: string
    items: Permiso[]
  }>()
  for (const permiso of permisos.data ?? []) {
    const grupo = permisosPorRecurso.get(permiso.recurso) ?? {
      recurso: permiso.recurso,
      items: [],
    }
    grupo.items.push(permiso)
    permisosPorRecurso.set(permiso.recurso, grupo)
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
        aria-labelledby="titulo-permisos-modal"
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg border border-salvia-200 bg-white p-6 shadow-lg"
      >
        <h2
          id="titulo-permisos-modal"
          className="font-display text-lg font-semibold text-pino-900"
        >
          Permisos de {rol?.nombre}
        </h2>
        <p className="mt-1 text-sm/6 text-salvia-700">
          Marca las acciones que este rol puede realizar. Se reemplaza el set
          completo al guardar.
        </p>

        <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {permisos.isPending ? (
            <div className="flex items-center justify-center gap-3 p-6 text-sm text-salvia-600">
              <Spinner size="sm" label="Cargando permisos" />
              Cargando permisos…
            </div>
          ) : permisos.isError ? (
            <Alert variant="error">
              No se pudo cargar el catálogo de permisos.
            </Alert>
          ) : (
            [...permisosPorRecurso.values()].map((grupo) => (
              <fieldset key={grupo.recurso} className="rounded-md border border-salvia-200 p-3">
                <legend className="px-1 text-xs font-semibold tracking-wide text-salvia-600">
                  {grupo.recurso}
                </legend>
                <div className="space-y-2">
                  {grupo.items.map((permiso) => (
                    <div key={permiso.id} className="flex items-start gap-2">
                      <input
                        id={`permiso-${permiso.id}`}
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 rounded border-salvia-300 text-pino-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600"
                        checked={marcados.has(permiso.id)}
                        onChange={() => alternar(permiso.id)}
                      />
                      <label
                        htmlFor={`permiso-${permiso.id}`}
                        className="text-sm text-pino-900"
                      >
                        <span className="font-medium">{`${permiso.recurso}:${permiso.accion}`}</span>
                        {permiso.descripcion && (
                          <span className="block text-xs text-salvia-600">
                            {permiso.descripcion}
                          </span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </fieldset>
            ))
          )}
        </div>

        {asignar.isError && (
          <Alert variant="error" className="mt-4">
            No se pudieron guardar los permisos. Intenta de nuevo.
          </Alert>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={onCerrar}
            disabled={asignar.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={asignar.isPending || permisos.isPending}>
            {asignar.isPending ? (
              <Spinner size="sm" label="Guardando permisos…" />
            ) : (
              'Guardar permisos'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
