import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { IconoContactos } from '@/lib/iconos'
import { Td, Table, Th } from '@/components/ui/table'
import { ContactoFormularioModal } from '../components/contacto-formulario-modal'
import {
  useActualizarContacto,
  useContactos,
  useEliminarContacto,
} from '../hooks'
import type { Contacto } from '../types'

type PrioridadProps = {
  valor: number
}

/** Prioridad como etiqueta comprensible, no solo color (ver AGENTS.md). */
function BadgePrioridad({ valor }: PrioridadProps) {
  const etiqueta =
    valor <= 2 ? 'Alta' : valor <= 5 ? 'Media' : 'Baja'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
        valor <= 2
          ? 'bg-red-100 text-red-800'
          : valor <= 5
            ? 'bg-amber-100 text-amber-800'
            : 'bg-salvia-100 text-salvia-600'
      }`}
    >
      {etiqueta} ({valor})
    </span>
  )
}

type BadgeProps = {
  activo: boolean
}

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
      return 'No tienes permisos para administrar contactos.'
    }
  }

  return 'No se pudieron cargar los contactos. Verifica tu conexión e intenta de nuevo.'
}

/**
 * Contactos de emergencia (/panel/contactos).
 * Consumo real de GET /contactos mediante TanStack Query.
 * Las acciones (alta, edición, baja) ejecutan mutations contra el backend.
 */
export function ContactosPage() {
  const contactos = useContactos()
  const desactivar = useActualizarContacto()
  const eliminar = useEliminarContacto()

  const [modalAbierto, setModalAbierto] = useState(false)
  const [contactoEditar, setContactoEditar] = useState<Contacto | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  const ocupados = new Set<string>([
    ...(desactivar.isPending && desactivar.variables
      ? [desactivar.variables.id]
      : []),
    ...(eliminar.isPending && eliminar.variables ? [eliminar.variables] : []),
  ])

  function desactivarContacto(contacto: Contacto) {
    const confirmado = window.confirm(
      `¿Marcar como inactivo el contacto ${contacto.nombre}? Podrás reactivarlo editándolo más tarde.`,
    )

    if (!confirmado) return

    setErrorAccion(null)
    desactivar.mutate(
      { id: contacto.id, datos: { activo: false } },
      {
        onError: () =>
          setErrorAccion(`No se pudo desactivar el contacto ${contacto.nombre}.`),
      },
    )
  }

  function eliminarContacto(contacto: Contacto) {
    const confirmado = window.confirm(
      `¿Eliminar definitivamente el contacto ${contacto.nombre}? Esta acción no se puede deshacer.`,
    )

    if (!confirmado) return

    setErrorAccion(null)
    eliminar.mutate(contacto.id, {
      onError: () =>
        setErrorAccion(`No se pudo eliminar el contacto ${contacto.nombre}.`),
    })
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-pino-900">
          <IconoContactos size={24} className="text-pino-600" />
          Contactos de emergencia
        </h1>

        <Button
          onClick={() => {
            setContactoEditar(null)
            setModalAbierto(true)
          }}
        >
          Nuevo contacto
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
        {contactos.isPending ? (
          <div className="flex items-center justify-center gap-3 p-10 text-sm text-salvia-600">
            <Spinner size="sm" label="Cargando contactos" />
            Cargando contactos…
          </div>
        ) : contactos.isError ? (
          <div className="space-y-3 p-6">
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            >
              {mensajeDeError(contactos.error)}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void contactos.refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : contactos.data.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-pino-900">
              No hay contactos de emergencia
            </p>
            <p className="mt-1 text-sm text-salvia-600">
              Agrega los contactos del adulto mayor para quienes recibirán
              alertas.
            </p>
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Nombre</Th>
                <Th>Parentesco</Th>
                <Th>Teléfono</Th>
                <Th>Correo electrónico</Th>
                <Th>Prioridad</Th>
                <Th>Estado</Th>
                <Th>
                  <span className="sr-only">Acciones</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {contactos.data.map((contacto) => {
                const ocupado = ocupados.has(contacto.id)

                return (
                  <tr key={contacto.id} className="hover:bg-salvia-50">
                    <Td className="font-medium">{contacto.nombre}</Td>
                    <Td>{contacto.parentesco ?? '—'}</Td>
                    <Td>{contacto.telefono}</Td>
                    <Td>{contacto.email ?? '—'}</Td>
                    <Td>
                      <BadgePrioridad valor={contacto.prioridad} />
                    </Td>
                    <Td>
                      <BadgeEstado activo={contacto.activo} />
                    </Td>
                    <Td>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={ocupado}
                          onClick={() => {
                            setErrorAccion(null)
                            setContactoEditar(contacto)
                            setModalAbierto(true)
                          }}
                        >
                          Editar
                        </Button>
                        {contacto.activo && (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={ocupado}
                            onClick={() => desactivarContacto(contacto)}
                          >
                            Desactivar
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={ocupado}
                          onClick={() => eliminarContacto(contacto)}
                        >
                          Eliminar
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

      {/* key distinta por modo/contacto: remonta y reinicia el formulario. */}
      <ContactoFormularioModal
        key={contactoEditar?.id ?? 'nuevo'}
        abierto={modalAbierto}
        contactoEditar={contactoEditar}
        onCerrar={() => {
          setModalAbierto(false)
          setContactoEditar(null)
        }}
      />
    </section>
  )
}
