import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { IconoDispositivos } from '@/lib/iconos'
import { Td, Table, Th } from '@/components/ui/table'
import { formatFecha } from '@/lib/format'
import { DispositivoFormularioModal } from '../components/dispositivo-formulario-modal'
import { useDispositivos, useEliminarDispositivo } from '../hooks'
import type { Dispositivo } from '../types'

type BadgeProps = {
  activo: boolean
}

/** Estado del dispositivo: no depender solo del color (ver AGENTS.md). */
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

const etiquetaPlataforma: Record<Dispositivo['plataforma'], string> = {
  ANDROID: 'Android',
  IOS: 'iOS',
  WEB: 'Web',
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
      return 'No tienes permisos para administrar dispositivos.'
    }
  }

  return 'No se pudieron cargar los dispositivos. Verifica tu conexión e intenta de nuevo.'
}

/**
 * Dispositivos (/panel/dispositivos).
 * Consumo real de GET /dispositivos mediante TanStack Query.
 * Las acciones (registro, edición, baja) ejecutan mutations contra el
 * backend.
 */
export function DispositivosPage() {
  const dispositivos = useDispositivos()
  const eliminar = useEliminarDispositivo()

  const [modalAbierto, setModalAbierto] = useState(false)
  const [dispositivoEditar, setDispositivoEditar] =
    useState<Dispositivo | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  const ocupados = new Set<string>(
    eliminar.isPending && eliminar.variables ? [eliminar.variables] : [],
  )

  function eliminarDispositivo(dispositivo: Dispositivo) {
    const confirmado = window.confirm(
      `¿Eliminar definitivamente el dispositivo ${dispositivo.nombre}? Esta acción no se puede deshacer.`,
    )

    if (!confirmado) return

    setErrorAccion(null)
    eliminar.mutate(dispositivo.id, {
      onError: () =>
        setErrorAccion(
          `No se pudo eliminar el dispositivo ${dispositivo.nombre}.`,
        ),
    })
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-pino-900">
          <IconoDispositivos size={24} className="text-pino-600" />
          Dispositivos
        </h1>

        <Button
          onClick={() => {
            setDispositivoEditar(null)
            setModalAbierto(true)
          }}
        >
          Registrar dispositivo
        </Button>
      </div>

      {errorAccion && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          {errorAccion}
        </div>
      )}

      <div className="rounded-lg border border-salvia-200 bg-white shadow-sm">
        {dispositivos.isPending ? (
          <div className="flex items-center justify-center gap-3 p-10 text-sm text-salvia-600">
            <Spinner size="sm" label="Cargando dispositivos" />
            Cargando dispositivos…
          </div>
        ) : dispositivos.isError ? (
          <div className="space-y-3 p-6">
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            >
              {mensajeDeError(dispositivos.error)}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void dispositivos.refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : dispositivos.data.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-pino-900">
              Sin dispositivos registrados
            </p>
            <p className="mt-1 text-sm text-salvia-600">
              Aquí aparecen los teléfonos con la app RIBANI instalada (la app
              se registra sola al iniciar sesión). También puedes registrar
              uno manualmente con «Registrar dispositivo».
            </p>
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Nombre</Th>
                <Th>Plataforma</Th>
                <Th>Versión de la app</Th>
                <Th>Estado</Th>
                <Th>Última conexión</Th>
                <Th>
                  <span className="sr-only">Acciones</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {dispositivos.data.map((dispositivo) => {
                const ocupado = ocupados.has(dispositivo.id)

                return (
                  <tr key={dispositivo.id} className="hover:bg-salvia-50">
                    <Td className="font-medium">{dispositivo.nombre}</Td>
                    <Td>{etiquetaPlataforma[dispositivo.plataforma]}</Td>
                    <Td>{dispositivo.version_app ?? '—'}</Td>
                    <Td>
                      <BadgeEstado activo={dispositivo.activo} />
                    </Td>
                    <Td>
                      {dispositivo.ultimo_latido_en
                        ? formatFecha(dispositivo.ultimo_latido_en)
                        : 'Nunca se conectó'}
                    </Td>
                    <Td>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={ocupado}
                          onClick={() => {
                            setErrorAccion(null)
                            setDispositivoEditar(dispositivo)
                            setModalAbierto(true)
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={ocupado}
                          onClick={() => eliminarDispositivo(dispositivo)}
                        >
                          {ocupado ? (
                            <Spinner size="sm" label="Eliminando…" />
                          ) : (
                            'Eliminar'
                          )}
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

      {/* key distinta por modo/dispositivo: remonta y reinicia el formulario. */}
      <DispositivoFormularioModal
        key={dispositivoEditar?.id ?? 'nuevo'}
        abierto={modalAbierto}
        dispositivoEditar={dispositivoEditar}
        onCerrar={() => {
          setModalAbierto(false)
          setDispositivoEditar(null)
        }}
      />
    </section>
  )
}
