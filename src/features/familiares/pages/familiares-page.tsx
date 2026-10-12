import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { IconoFamiliares } from '@/lib/iconos'
import { Td, Table, Th } from '@/components/ui/table'
import { formatFecha } from '@/lib/format'
import { InvitarFamiliarModal } from '../components/invitar-familiar-modal'
import { DosPasosAdultoModal } from '../components/dos-pasos-adulto-modal'
import {
  useAceptarInvitacion,
  useActualizarVinculo,
  useDesvincularFamiliar,
  useInvitacionesPendientes,
  useMisAdultos,
  useMisFamiliares,
  useRechazarInvitacion,
  useVinculos,
} from '../hooks'
import { useAuthStore } from '@/stores/auth-store'
import { ROL_ADMINISTRADOR } from '@/app/guards/require-role'
import type { VinculoAdmin, AdultoVinculado } from '../types'

type EstadoBadgeProps = {
  estado: 'ACTIVA' | 'PENDIENTE' | 'REVOCADA'
}

/** Estado del vínculo: no depender solo del color (ver AGENTS.md). */
function BadgeEstado({ estado }: EstadoBadgeProps) {
  const variantes = {
    ACTIVA: 'bg-pino-100 text-pino-800',
    PENDIENTE: 'bg-amber-100 text-amber-800',
    REVOCADA: 'bg-red-100 text-red-800',
  } as const

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variantes[estado]}`}
    >
      {estado.toLowerCase()}
    </span>
  )
}

/** Traduce errores HTTP a mensajes comprensibles (ver AGENTS.md). */
function mensajeDeError(error: unknown, recurso: string): string {
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
      return `No tienes permisos para administrar ${recurso}.`
    }
  }

  return `No se pudieron cargar ${recurso}. Verifica tu conexión e intenta de nuevo.`
}

/**
 * Tabla de relaciones FAMILIAR_ENCARGADO ↔ ADULTO_MAYOR para el admin.
 * GET /familiares trae TODAS las relaciones con ambas personas.
 */
function TablaRelacionesAdmin({
  vinculos,
  ocupados,
  onRevocar,
  onEliminar,
}: {
  vinculos: VinculoAdmin[]
  ocupados: Set<string>
  onRevocar: (id: string) => void
  onEliminar: (id: string) => void
}) {
  return (
    <div className="rounded-lg border border-salvia-200 bg-white shadow-sm">
      <div className="border-b border-salvia-100 px-4 py-3">
        <h2 className="font-display text-base font-semibold text-pino-900">
          Relaciones familiar–adulto mayor
        </h2>
        <p className="mt-0.5 text-xs text-salvia-600">
          Todas las relaciones FAMILIAR_ENCARGADO ↔ ADULTO_MAYOR del sistema.
        </p>
      </div>

      {vinculos.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-sm font-medium text-pino-900">
            No hay relaciones registradas
          </p>
          <p className="mt-1 text-sm text-salvia-600">
            Usa «Invitar cuidador» o «Vincular familiar» para crear la primera
            relación entre un familiar encargado y un adulto mayor.
          </p>
        </div>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Familiar encargado</Th>
              <Th>Adulto mayor</Th>
              <Th>Parentesco</Th>
              <Th>Permisos</Th>
              <Th>Estado</Th>
              <Th>
                <span className="sr-only">Acciones</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {vinculos.map((vinculo) => {
              const ocupado = ocupados.has(vinculo.id)

              return (
                <tr key={vinculo.id} className="hover:bg-salvia-50">
                  <Td className="font-medium">
                    {vinculo.familiar.nombre} {vinculo.familiar.apellido}
                    <span className="block text-xs text-salvia-600">
                      {vinculo.familiar.email}
                    </span>
                  </Td>
                  <Td className="font-medium">
                    {vinculo.adulto.nombre} {vinculo.adulto.apellido}
                    <span className="block text-xs text-salvia-600">
                      {vinculo.adulto.email}
                    </span>
                  </Td>
                  <Td>{vinculo.parentesco ?? '—'}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {vinculo.puede_ver_ubicacion && (
                        <span className="rounded bg-pino-50 px-1.5 py-0.5 text-xs text-pino-800">
                          Ubicación
                        </span>
                      )}
                      {vinculo.puede_gestionar_medicamentos && (
                        <span className="rounded bg-pino-50 px-1.5 py-0.5 text-xs text-pino-800">
                          Medicamentos
                        </span>
                      )}
                      {!vinculo.puede_ver_ubicacion &&
                        !vinculo.puede_gestionar_medicamentos && <span>—</span>}
                    </div>
                  </Td>
                  <Td>
                    <BadgeEstado estado={vinculo.estado} />
                  </Td>
                  <Td>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={ocupado || vinculo.estado !== 'ACTIVA'}
                        onClick={() => onRevocar(vinculo.id)}
                      >
                        Revocar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={ocupado}
                        onClick={() => onEliminar(vinculo.id)}
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
  )
}

/**
 * Familiares y vínculos (/panel/familiares).
 *
 * El módulo tiene dos puntos de vista según quién eres en la relación:
 * - "Adultos que cuidas": si eres familiar encargado, son las personas
 *   mayores a cuyo cuidado aportas (GET /familiares/mis-adultos).
 * - "Otros cuidadores de tu adulto": si eres el adulto mayor, son los
 *   familiares que tienen acceso a tu información
 *   (GET /familiares/mis-familiares).
 */
export function FamiliaresPage() {
  const esAdmin =
    useAuthStore((state) => state.usuario)?.rol.codigo === ROL_ADMINISTRADOR

  // Consultas
  const adultos = useMisAdultos()
  const familiares = useMisFamiliares()
  const invitaciones = useInvitacionesPendientes()
  const vinculosAdmin = useVinculos()

  // Mutaciones
  const aceptar = useAceptarInvitacion()
  const rechazar = useRechazarInvitacion()
  const desvincular = useDesvincularFamiliar()
  const actualizarVinculo = useActualizarVinculo()

  const [modalInvitarAbierto, setModalInvitarAbierto] = useState(false)
  const [adultoDosPasos, setAdultoDosPasos] = useState<AdultoVinculado | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  function aceptarInvitacion(id: string) {
    setErrorAccion(null)
    aceptar.mutate(id, {
      onError: () =>
        setErrorAccion('No se pudo aceptar la invitación. Intenta de nuevo.'),
    })
  }

  function rechazarInvitacion(id: string) {
    setErrorAccion(null)
    rechazar.mutate(id, {
      onError: () =>
        setErrorAccion('No se pudo rechazar la invitación. Intenta de nuevo.'),
    })
  }

  function revocarVinculo(id: string) {
    const confirmado = window.confirm(
      '¿Revocar el acceso de este familiar? Dejará de ver la información del adulto.',
    )
    if (!confirmado) return

    setErrorAccion(null)
    // REVOCADA es un estado válido del UpdateFamiliarDto.
    actualizarVinculo.mutate(
      { id, datos: { estado: 'REVOCADA' } },
      {
        onError: () =>
          setErrorAccion('No se pudo revocar el acceso. Intenta de nuevo.'),
      },
    )
  }

  function eliminarVinculo(id: string) {
    const confirmado = window.confirm(
      '¿Eliminar definitivamente el vínculo? Esta acción no se puede deshacer.',
    )
    if (!confirmado) return

    setErrorAccion(null)
    desvincular.mutate(id, {
      onError: () =>
        setErrorAccion('No se pudo eliminar el vínculo. Intenta de nuevo.'),
    })
  }

  const ocupadosInvitacion = new Set<string>([
    ...(aceptar.isPending && aceptar.variables ? [aceptar.variables] : []),
    ...(rechazar.isPending && rechazar.variables ? [rechazar.variables] : []),
  ])

  const ocupadosVinculo = new Set<string>([
    ...(actualizarVinculo.isPending && actualizarVinculo.variables
      ? [actualizarVinculo.variables.id]
      : []),
    ...(desvincular.isPending && desvincular.variables
      ? [desvincular.variables]
      : []),
  ])

  // Vista ADMINISTRADOR: tabla de TODAS las relaciones del sistema.
  if (esAdmin) {
    return (
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-pino-900">
            <IconoFamiliares size={24} className="text-pino-600" />
            Familiares y vínculos
          </h1>

          <Button onClick={() => setModalInvitarAbierto(true)}>
            Invitar cuidador
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

        {vinculosAdmin.isPending ? (
          <div className="flex items-center justify-center gap-3 p-10 text-sm text-salvia-600">
            <Spinner size="sm" label="Cargando relaciones" />
            Cargando relaciones…
          </div>
        ) : vinculosAdmin.isError ? (
          <div className="space-y-3 p-6 rounded-lg border border-salvia-200 bg-white">
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            >
              {mensajeDeError(vinculosAdmin.error, 'las relaciones')}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void vinculosAdmin.refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : (
          <TablaRelacionesAdmin
            vinculos={vinculosAdmin.data}
            ocupados={ocupadosVinculo}
            onRevocar={revocarVinculo}
            onEliminar={eliminarVinculo}
          />
        )}

        <InvitarFamiliarModal
          abierto={modalInvitarAbierto}
          onCerrar={() => setModalInvitarAbierto(false)}
        />
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-pino-900">
          <IconoFamiliares size={24} className="text-pino-600" />
          Familiares y vínculos
        </h1>

        <Button onClick={() => setModalInvitarAbierto(true)}>
          Invitar cuidador
        </Button>
      </div>



      {/* Invitaciones pendientes (GET /familiares/invitaciones/pendientes) */}
      {!invitaciones.isPending &&
        !invitaciones.isError &&
        invitaciones.data.length > 0 && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
            <h2 className="text-sm font-semibold text-amber-900">
              Invitaciones pendientes de tu respuesta
            </h2>
            <ul className="mt-3 space-y-2">
              {invitaciones.data.map((invitacion) => {
                const ocupada = ocupadosInvitacion.has(invitacion.id)

                return (
                  <li
                    key={invitacion.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-white px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-pino-900">
                        {invitacion.familiar_nombre}{' '}
                        {invitacion.familiar_apellido}
                      </p>
                      <p className="text-xs text-salvia-600">
                        {invitacion.familiar_email}
                        {invitacion.parentesco
                          ? ` · ${invitacion.parentesco}`
                          : ''}
                        {' · '}
                        {formatFecha(invitacion.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        disabled={ocupada}
                        onClick={() => aceptarInvitacion(invitacion.id)}
                      >
                        Aceptar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={ocupada}
                        onClick={() => rechazarInvitacion(invitacion.id)}
                      >
                        Rechazar
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

      {/* Adultos a cargo (GET /familiares/mis-adultos) */}
      <div className="rounded-lg border border-salvia-200 bg-white shadow-sm">
        <div className="border-b border-salvia-100 px-4 py-3">
          <h2 className="font-display text-base font-semibold text-pino-900">
            Adultos que cuidas
          </h2>
          <p className="mt-0.5 text-xs text-salvia-600">
            Personas mayores a cuyo cuidado puedes acompañar desde tu cuenta.
          </p>
        </div>

        {adultos.isPending ? (
          <div className="flex items-center justify-center gap-3 p-10 text-sm text-salvia-600">
            <Spinner size="sm" label="Cargando adultos" />
            Cargando adultos…
          </div>
        ) : adultos.isError ? (
          <div className="space-y-3 p-6">
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            >
              {mensajeDeError(adultos.error, 'los adultos')}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void adultos.refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : adultos.data.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-pino-900">
              Todavía no acompañas a nadie
            </p>
            <p className="mt-1 text-sm text-salvia-600">
              Cuando la familia de un adulto mayor acepte invitarte como
              cuidador, su persona aparecerá aquí.
            </p>
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Adulto mayor</Th>
                <Th>Parentesco</Th>
                <Th>Permisos</Th>
                <Th>Estado</Th>
                <Th>
                  <span className="sr-only">Acciones</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {adultos.data.map((adulto) => {
                const ocupado = ocupadosVinculo.has(adulto.vinculo_id)

                return (
                  <tr key={adulto.id} className="hover:bg-salvia-50">
                    <Td className="font-medium">
                      {adulto.nombre} {adulto.apellido}
                      <span className="block text-xs text-salvia-600">
                        {adulto.email}
                      </span>
                    </Td>
                    <Td>{adulto.parentesco ?? '—'}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {adulto.puede_ver_ubicacion && (
                          <span className="rounded bg-pino-50 px-1.5 py-0.5 text-xs text-pino-800">
                            Ubicación
                          </span>
                        )}
                        {adulto.puede_gestionar_medicamentos && (
                          <span className="rounded bg-pino-50 px-1.5 py-0.5 text-xs text-pino-800">
                            Medicamentos
                          </span>
                        )}
                        {!adulto.puede_ver_ubicacion &&
                          !adulto.puede_gestionar_medicamentos && <span>—</span>}
                      </div>
                    </Td>
                    <Td>
                      <BadgeEstado estado={adulto.estado} />
                    </Td>
                    <Td>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {adulto.estado === 'ACTIVA' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={ocupado}
                            onClick={() => setAdultoDosPasos(adulto)}
                          >
                            2FA
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={ocupado || adulto.estado !== 'ACTIVA'}
                          onClick={() => revocarVinculo(adulto.vinculo_id)}
                        >
                          Revocar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={ocupado}
                          onClick={() => eliminarVinculo(adulto.vinculo_id)}
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

      {/* Familiares vinculados (GET /familiares/mis-familiares) */}
      <div className="rounded-lg border border-salvia-200 bg-white shadow-sm">
        <div className="border-b border-salvia-100 px-4 py-3">
          <h2 className="font-display text-base font-semibold text-pino-900">
            Otros cuidadores de tu adulto
          </h2>
          <p className="mt-0.5 text-xs text-salvia-600">
            Familiares que también tienen acceso a la información del adulto
            mayor con el que tienes vínculo.
          </p>
        </div>

        {familiares.isPending ? (
          <div className="flex items-center justify-center gap-3 p-10 text-sm text-salvia-600">
            <Spinner size="sm" label="Cargando familiares" />
            Cargando familiares…
          </div>
        ) : familiares.isError ? (
          <div className="space-y-3 p-6">
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            >
              {mensajeDeError(familiares.error, 'los familiares')}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void familiares.refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : familiares.data.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-pino-900">
              Eres el único cuidador con acceso
            </p>
            <p className="mt-1 text-sm text-salvia-600">
              Usa «Invitar cuidador» para que otro familiar pueda acompañar el
              cuidado de tu adulto mayor.
            </p>
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th> Familiar</Th>
                <Th>Parentesco</Th>
                <Th>Permisos</Th>
                <Th>Estado</Th>
                <Th>
                  <span className="sr-only">Acciones</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {familiares.data.map((familiar) => {
                const ocupado = ocupadosVinculo.has(familiar.vinculo_id)

                return (
                  <tr key={familiar.id} className="hover:bg-salvia-50">
                    <Td className="font-medium">
                      {familiar.nombre} {familiar.apellido}
                      <span className="block text-xs text-salvia-600">
                        {familiar.email}
                      </span>
                    </Td>
                    <Td>{familiar.parentesco ?? '—'}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {familiar.es_contacto_principal && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                            Principal
                          </span>
                        )}
                        {familiar.puede_ver_ubicacion && (
                          <span className="rounded bg-pino-50 px-1.5 py-0.5 text-xs text-pino-800">
                            Ubicación
                          </span>
                        )}
                        {familiar.puede_gestionar_medicamentos && (
                          <span className="rounded bg-pino-50 px-1.5 py-0.5 text-xs text-pino-800">
                            Medicamentos
                          </span>
                        )}
                      </div>
                    </Td>
                    <Td>
                      <BadgeEstado estado={familiar.estado} />
                    </Td>
                    <Td>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={ocupado || familiar.estado !== 'ACTIVA'}
                          onClick={() => revocarVinculo(familiar.vinculo_id)}
                        >
                          Revocar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={ocupado}
                          onClick={() => eliminarVinculo(familiar.vinculo_id)}
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

      <InvitarFamiliarModal
        abierto={modalInvitarAbierto}
        onCerrar={() => setModalInvitarAbierto(false)}
      />

      {/* key distinta por adulto: remonta el modal y reinicia su estado. */}
      {adultoDosPasos && (
        <DosPasosAdultoModal
          key={adultoDosPasos.id}
          abierto={adultoDosPasos !== null}
          adulto={adultoDosPasos}
          onCerrar={() => setAdultoDosPasos(null)}
        />
      )}
    </section>
  )
}
