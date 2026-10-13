import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { IconoRoles } from '@/lib/iconos'
import { Td, Table, Th } from '@/components/ui/table'
import { useEliminarRol, useRoles } from '../hooks'
import type { RolLista } from '../types'
import { RolFormularioModal } from '../components/rol-formulario-modal'
import { RolPermisosModal } from '../components/rol-permisos-modal'

type BadgeProps = {
  activo: boolean
}

/** Estado del rol: no depender solo del color (ver AGENTS.md). */
function BadgeEstado({ activo }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
        activo ? 'bg-pino-100 text-pino-800' : 'bg-salvia-100 text-salvia-600'
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${
          activo ? 'bg-pino-600' : 'bg-salvia-400'
        }`}
      />
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  )
}

/** Traduce errores HTTP a mensajes comprensibles (ver AGENTS.md). */
function mensajeDeError(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'status' in error.response
  ) {
    const status = error.response.status
    if (status === 403) {
      return 'No tienes permisos para administrar roles.'
    }
  }

  return 'No se pudieron cargar los roles. Verifica tu conexión e intenta de nuevo.'
}


export function RolesPage() {
  const roles = useRoles()
  const eliminar = useEliminarRol()

  const [rolEditar, setRolEditar] = useState<RolLista | null>(null)
  const [rolPermisos, setRolPermisos] = useState<RolLista | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  const ocupados = new Set<number>(
    eliminar.isPending && eliminar.variables ? [eliminar.variables] : [],
  )

  function eliminarRol(rol: RolLista) {
    const confirmado = window.confirm(
      `¿Eliminar definitivamente el rol ${rol.nombre}? Esta acción no se puede deshacer.`,
    )

    if (!confirmado) return

    setErrorAccion(null)
    eliminar.mutate(rol.id, {
      onError: () => setErrorAccion(`No se pudo eliminar el rol ${rol.nombre}.`),
    })
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-pino-900">
          <IconoRoles size={24} className="text-pino-600" />
          Roles
        </h1>
      </div>

      <p className="max-w-2xl text-sm/6 text-salvia-700">
        Cada rol define qué puede hacer un usuario del sistema. Asigna
        permisos con cuidado: la autorización real siempre la valida el
        backend.
      </p>

      {errorAccion && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          {errorAccion}
        </div>
      )}

      <div className="rounded-lg border border-salvia-200 bg-white shadow-sm">
        {roles.isPending ? (
          <div className="flex items-center justify-center gap-3 p-10 text-sm text-salvia-600">
            <Spinner size="sm" label="Cargando roles" />
            Cargando roles…
          </div>
        ) : roles.isError ? (
          <div className="space-y-3 p-6">
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            >
              {mensajeDeError(roles.error)}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void roles.refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : roles.data.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-pino-900">
              No hay roles definidos
            </p>
            <p className="mt-1 text-sm text-salvia-600">
              Los roles se crean desde el backend; aquí puedes editarlos y
              asignarles permisos.
            </p>
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Nombre</Th>
                <Th>Código</Th>
                <Th>Descripción</Th>
                <Th>Estado</Th>
                <Th>Permisos</Th>
                <Th>
                  <span className="sr-only">Acciones</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {roles.data.map((rol) => {
                const ocupado = ocupados.has(rol.id)

                return (
                  <tr key={rol.id} className="hover:bg-salvia-50">
                    <Td className="font-medium">{rol.nombre}</Td>
                    <Td>
                      <code className="rounded bg-salvia-100 px-1.5 py-0.5 text-xs text-pino-900">
                        {rol.codigo}
                      </code>
                    </Td>
                    <Td>{rol.descripcion ?? '—'}</Td>
                    <Td>
                      <BadgeEstado activo={rol.activo} />
                    </Td>
                    <Td>{rol.permisos.length}</Td>
                    <Td>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={ocupado}
                          onClick={() => {
                            setErrorAccion(null)
                            setRolEditar(rol)
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={ocupado}
                          onClick={() => {
                            setErrorAccion(null)
                            setRolPermisos(rol)
                          }}
                        >
                          Permisos
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={ocupado}
                          onClick={() => eliminarRol(rol)}
                        >
                          {ocupado ? <Spinner size="sm" label="Eliminando…" /> : 'Eliminar'}
                        </Button>
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </div>

      {/* key distinta por rol: remonta y reinicia los formularios. */}
      <RolFormularioModal
        key={`editar-${rolEditar?.id ?? 'ninguno'}`}
        abierto={rolEditar !== null}
        rol={rolEditar}
        onCerrar={() => setRolEditar(null)}
      />
      <RolPermisosModal
        key={`permisos-${rolPermisos?.id ?? 'ninguno'}`}
        abierto={rolPermisos !== null}
        rol={rolPermisos}
        onCerrar={() => setRolPermisos(null)}
      />
    </section>
  )
}
