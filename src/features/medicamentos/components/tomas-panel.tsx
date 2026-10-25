import { useState } from 'react'
import type { FormEvent } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { formatFechaHora } from '@/lib/format'
import {
  useActualizarToma,
  useCrearToma,
  useEliminarToma,
  useMedicamentos,
  useTomas,
} from '../hooks'
import type { Toma } from '../types'

type TomasPanelProps = {
  /** Medicamentos listados en la página (para mapear id → nombre). */
  medicamentos: ReturnType<typeof useMedicamentos>
}

type FiltroEstado = 'TODAS' | 'PENDIENTE' | 'TOMADA' | 'OMITIDA'

const estados: Array<{ valor: FiltroEstado; etiqueta: string }> = [
  { valor: 'TODAS', etiqueta: 'Todas' },
  { valor: 'PENDIENTE', etiqueta: 'Pendientes' },
  { valor: 'TOMADA', etiqueta: 'Tomadas' },
  { valor: 'OMITIDA', etiqueta: 'Omitidas' },
]

type MutationError = { response?: { status?: number; data?: { message?: string } } }

/** Extrae el mensaje HTTP del backend para avisos de modal. */
function extraerMensaje(error: unknown): string {
  const posible = error as MutationError | undefined
  const message = posible?.response?.data?.message

  if (typeof message === 'string' && message.length > 0) {
    return message
  }
  if (posible?.response?.status === 403) {
    return 'no tienes permisos para esta acción'
  }
  if (posible?.response?.status === 409) {
    return 'la toma ya no está pendiente o ya existe en esa fecha'
  }
  return 'intenta de nuevo'
}

/** Muestra el error de la última mutation de un modal vía alert(). */
function manejarErrorEnModal(
  mutation: { error: unknown },
  mensajeBase: string,
): void {
  const detalle = extraerMensaje(mutation.error)
  window.alert(`${mensajeBase}: ${detalle}`)
}

function etiquetaEstado(estado: Toma['estado']): string {
  switch (estado) {
    case 'PENDIENTE':
      return 'Pendiente'
    case 'POSPUESTA':
      return 'Pospuesta'
    case 'CANCELADA':
      return 'Cancelada'
    case 'TOMADA':
      return 'Tomada'
    case 'OMITIDA':
      return 'Omitida'
  }
}

function claseEstado(estado: Toma['estado']): string {
  switch (estado) {
    case 'PENDIENTE':
      return 'bg-salvia-100 text-salvia-700'
    case 'POSPUESTA':
      return 'bg-amber-100 text-amber-800'
    case 'CANCELADA':
      return 'bg-salvia-100 text-salvia-700'
    case 'TOMADA':
      return 'bg-pino-100 text-pino-800'
    case 'OMITIDA':
      return 'bg-red-100 text-red-800'
  }
}

/**
 * Sección "Tomas" del panel de medicamentos: gestiona los registros
 * concretos de toma (PENDIENTE/TOMADA/OMITIDA) que produce el cron
 * generador más los puntuales, con:
 * - filtros de estado y rango de fechas;
 * - acciones rápidas TOMAR/OMITIR sobre pendientes;
 * - edición de fecha/nota de las pendientes;
 * - eliminación de cualquier toma del historial (baja lógica en el backend:
 *   la fila pasa a CANCELADA, se conserva la auditoría y deja de listarse).
 *
 * Los errores del server (ventana de registro, toma registrada, etc.)
 * se muestran tal cual llegan en el mensaje del axios error.
 */
export function TomasPanel({ medicamentos }: TomasPanelProps) {
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('TODAS')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  // Rango de fechas → backend (query desde/hasta); estado → cliente.
  // Recordar: cambiar la key recalcula el query (refetch al cambiar filtro).
  const filtrosBackend = {
    ...(desde ? { desde: new Date(`${desde}T00:00:00`).toISOString() } : {}),
    ...(hasta ? { hasta: new Date(`${hasta}T23:59:59`).toISOString() } : {}),
  }
  const tomas = useTomas(filtrosBackend)
  const actualizar = useActualizarToma()
  const eliminar = useEliminarToma()

  const [tomaEditando, setTomaEditando] = useState<Toma | null>(null)
  const [tomaRegistrando, setTomaRegistrando] = useState(false)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  const nombreDe = (medicamentoId: string): string => {
    const medicamento = medicamentos.data?.find(
      (item) => item.id === medicamentoId,
    )
    return medicamento?.nombre ?? 'Medicamento eliminado o inaccesible'
  }

  const ocupados = new Set<string>([
    ...(actualizar.isPending && actualizar.variables
      ? [actualizar.variables.id]
      : []),
    ...(eliminar.isPending && eliminar.variables ? [eliminar.variables] : []),
  ])

  // El estado se filtra en cliente; el rango de fechas ya viaja al
  // backend por query params (filtrosBackend en la key del query).
  const tomasFiltradas = (tomas.data ?? []).filter(
    (toma) => filtroEstado === 'TODAS' || toma.estado === filtroEstado || (filtroEstado === 'PENDIENTE' && toma.estado === 'POSPUESTA'),
  )

  function manejarError(mensajeBase: string, error: unknown) {
    let detalle =
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof error.response === 'object' &&
      error.response !== null &&
      'data' in error.response &&
      typeof error.response.data === 'object' &&
      error.response.data !== null &&
      'message' in error.response.data &&
      typeof error.response.data.message === 'string'
        ? `: ${error.response.data.message}`
        : ''

    if (
      detalle === '' &&
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof error.response === 'object' &&
      error.response !== null &&
      'status' in error.response &&
      error.response.status === 403
    ) {
      detalle = ': no tienes permisos para esta acción.'
    }

    setErrorAccion(`${mensajeBase}${detalle}`)
  }

  return (
    <div className="rounded-lg border border-salvia-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-salvia-100 px-4 py-3 sm:px-6">
        <div>
          <h2 className="font-display text-lg font-semibold text-pino-900">
            Tomas
          </h2>
          <p className="text-sm text-salvia-600">
            Registros concretos generados por los horarios (o puntuales).
            Puedes modificar su fecha/nota, omitir las pendientes o quitar
            cualquier registro del historial.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setErrorAccion(null)
            setTomaRegistrando(true)
          }}
        >
          Registrar toma
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3 px-4 py-3 sm:px-6">
        <div className="flex gap-1.5">
          {estados.map(({ valor, etiqueta }) => (
            <button
              key={valor}
              type="button"
              aria-pressed={filtroEstado === valor}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                filtroEstado === valor
                  ? 'border-pino-600 bg-pino-600 text-white'
                  : 'border-salvia-300 bg-white text-pino-900 hover:bg-salvia-100'
              }`}
              onClick={() => setFiltroEstado(valor)}
            >
              {etiqueta}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <div className="space-y-0.5">
            <label
              htmlFor="tomas-desde"
              className="block text-xs font-medium text-pino-900"
            >
              Desde
            </label>
            <Input
              id="tomas-desde"
              type="date"
              className="w-40"
              value={desde}
              onChange={(evento) => setDesde(evento.target.value)}
            />
          </div>
          <div className="space-y-0.5">
            <label
              htmlFor="tomas-hasta"
              className="block text-xs font-medium text-pino-900"
            >
              Hasta
            </label>
            <Input
              id="tomas-hasta"
              type="date"
              className="w-40"
              value={hasta}
              onChange={(evento) => setHasta(evento.target.value)}
            />
          </div>
          {(desde !== '' || hasta !== '') && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setDesde('')
                setHasta('')
              }}
            >
              Limpiar fechas
            </Button>
          )}
        </div>
      </div>

      {errorAccion && (
        <div
          role="alert"
          className="mx-4 mb-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 sm:mx-6"
        >
          {errorAccion}
        </div>
      )}

      <div className="px-4 pb-4 sm:px-6">
        {!tomas.isPending && !desde && !hasta && filtrosBackend.desde === undefined && (
          <p className="mb-3 text-xs text-salvia-500">
            Mostrando tomas de la última semana (el backend limita el rango
            desenconsultado).
          </p>
        )}

        {tomas.isPending ? (
          <div className="flex items-center justify-center gap-3 p-8 text-sm text-salvia-600">
            <Spinner size="sm" label="Cargando tomas" />
            Cargando tomas…
          </div>
        ) : tomas.isError ? (
          <Alert variant="error" className="p-4">
            No se pudo cargar el registro de tomas.
          </Alert>
        ) : tomasFiltradas.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-pino-900">
              No hay tomas con los filtros aplicados
            </p>
            <p className="mt-1 text-sm text-salvia-600">
              Ajusta los filtros o registra una toma puntual.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-salvia-100">
            {tomasFiltradas.map((toma) => {
              const ocupado = ocupados.has(toma.id)
              const esPendiente = toma.estado === 'PENDIENTE' || toma.estado === 'POSPUESTA'

              return (
                <li
                  key={toma.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-pino-900">
                      {nombreDe(toma.medicamento_id)}
                    </p>
                    <p className="text-xs text-salvia-600">
                      {formatFechaHora(toma.programada_para)}
                      {toma.estado === 'POSPUESTA' ? ` · aviso ${formatFechaHora(toma.recordar_en)}` : ''}
                      {toma.estado === 'TOMADA' && toma.tomada_en
                        ? ` · registrada ${formatFechaHora(toma.tomada_en)}`
                        : ''}
                      {toma.nota ? ` · ${toma.nota}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${claseEstado(toma.estado)}`}
                    >
                      {etiquetaEstado(toma.estado)}
                    </span>

                    {esPendiente && (
                      <>
                        <Button
                          size="sm"
                          disabled={ocupado}
                          onClick={() => {
                            setErrorAccion(null)
                            actualizar.mutate(
                              { id: toma.id, datos: { estado: 'TOMADA' } },
                              {
                                onError: (error) =>
                                  manejarError(
                                    'No se pudo marcar la toma. Verifica la ventana del horario.',
                                    error,
                                  ),
                              },
                            )
                          }}
                        >
                          Tomar
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={ocupado}
                          onClick={() => {
                            setErrorAccion(null)
                            actualizar.mutate(
                              { id: toma.id, datos: { estado: 'OMITIDA' } },
                              {
                                onError: (error) =>
                                  manejarError(
                                    'No se pudo omitir la toma.',
                                    error,
                                  ),
                              },
                            )
                          }}
                        >
                          Omitir
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={ocupado || toma.estado !== 'PENDIENTE'}
                          onClick={() => {
                            setErrorAccion(null)
                            setTomaEditando(toma)
                          }}
                        >
                          Editar
                        </Button>
                      </>
                    )}

                    <Button
                      variant="danger"
                      size="sm"
                      disabled={ocupado}
                      onClick={() => {
                        const confirmado = window.confirm(
                          `¿Eliminar del historial la toma del ${formatFechaHora(toma.programada_para)}? Dejará de aparecer en la lista.`,
                        )
                        if (!confirmado) return
                        setErrorAccion(null)
                        eliminar.mutate(toma.id, {
                          onError: (error) =>
                            manejarError(
                              'No se pudo eliminar la toma.',
                              error,
                            ),
                        })
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {tomaRegistrando && medicamentos.data?.length ? (
        <ModalRegistrarToma
          medicamentos={medicamentos.data.map((m) => ({
            id: m.id,
            activo: m.activo,
            nombre: m.nombre,
          }))}
          onCerrar={() => setTomaRegistrando(false)}
        />
      ) : null}

      {tomaEditando && (
        <ModalEditarToma
          key={`editar-${tomaEditando.id}`}
          toma={tomaEditando}
          onCerrar={() => setTomaEditando(null)}
        />
      )}
    </div>
  )
}

/** Modal: registrar toma puntual para un medicamento activo. */
function ModalRegistrarToma({
  medicamentos,
  onCerrar,
}: {
  medicamentos: Array<{ id: string; activo: boolean; nombre: string }>
  onCerrar: () => void
}) {
  const crearToma = useCrearToma()

  const activos = medicamentos.filter((m) => m.activo)
  const ahora = new Date()
  const predeterminado = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}T${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`

  const [medicamentoId, setMedicamentoId] = useState(activos[0]?.id ?? '')
  const [programadaPara, setProgramadaPara] = useState(predeterminado)
  const [nota, setNota] = useState('')

  function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!medicamentoId) return

    crearToma.mutate(
      {
        medicamento_id: medicamentoId,
        programada_para: new Date(programadaPara).toISOString(),
        nota: nota.trim() || undefined,
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
        aria-labelledby="titulo-registrar-toma"
        className="relative w-full max-w-md rounded-lg border border-salvia-200 bg-white p-6 shadow-lg"
      >
        <h2
          id="titulo-registrar-toma"
          className="font-display text-lg font-semibold text-pino-900"
        >
          Registrar toma
        </h2>
        <p className="mt-1 text-sm/6 text-salvia-700">
          Crea un registro puntual además de los generados por los horarios.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label
              htmlFor="toma-registrar-medicamento"
              className="block text-sm font-medium text-pino-900"
            >
              Medicamento
            </label>
            {activos.length === 0 ? (
              <Alert variant="info">
                No hay medicamentos activos para registrar tomas.
              </Alert>
            ) : (
              <select
                id="toma-registrar-medicamento"
                required
                className="w-full rounded-md border border-salvia-300 bg-white px-3 py-2 text-sm text-pino-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600"
                value={medicamentoId}
                onChange={(evento) => setMedicamentoId(evento.target.value)}
              >
                <option value="" disabled>
                  Selecciona un medicamento
                </option>
                {activos.map((medicamento) => (
                  <option key={medicamento.id} value={medicamento.id}>
                    {medicamento.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="toma-registrar-fecha"
              className="block text-sm font-medium text-pino-900"
            >
              Programada para
            </label>
            <Input
              id="toma-registrar-fecha"
              type="datetime-local"
              required
              value={programadaPara}
              onChange={(evento) => setProgramadaPara(evento.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="toma-registrar-nota"
              className="block text-sm font-medium text-pino-900"
            >
              Nota <span className="text-salvia-500">(opcional)</span>
            </label>
            <Input
              id="toma-registrar-nota"
              value={nota}
              onChange={(evento) => setNota(evento.target.value)}
            />
          </div>

          {crearToma.isError && (
            <Alert variant="error">
              No se pudo programar la toma. Intenta de nuevo.
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={onCerrar}
              disabled={crearToma.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={crearToma.isPending || activos.length === 0}
            >
              {crearToma.isPending ? (
                <Spinner size="sm" label="Programando…" />
              ) : (
                'Programar'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/** Modal: modificar una toma PENDIENTE (fecha y nota).
 *
 * El backend no permite cambiar programada_para vía PATCH /tomas/{id
 * (UpdateTomaDto solo acepta estado/tomada_en/dosis/nota), así que
 * "mover" la toma = eliminar + recrear en la nueva fecha. Se mantiene
 * la nota editada en la nueva fila.
 */
function ModalEditarToma({
  toma,
  onCerrar,
}: {
  toma: Toma
  onCerrar: () => void
}) {
  const actualizar = useActualizarToma()
  const eliminar = useEliminarToma()
  const crear = useCrearToma()

  const enCurso = actualizar.isPending || eliminar.isPending || crear.isPending

  const actual = new Date(toma.programada_para)
  const valorInicial = `${actual.getFullYear()}-${String(actual.getMonth() + 1).padStart(2, '0')}-${String(actual.getDate()).padStart(2, '0')}T${String(actual.getHours()).padStart(2, '0')}:${String(actual.getMinutes()).padStart(2, '0')}`

  const [programadaPara, setProgramadaPara] = useState(valorInicial)
  const [nota, setNota] = useState(toma.nota ?? '')

  const cambioFecha = programadaPara !== valorInicial

  function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    if (cambioFecha) {
      // Mover = eliminar (solo permitido en PENDIENTE) + recrear.
      eliminar.mutate(toma.id, {
        onSuccess: () => {
          crear.mutate(
            {
              medicamento_id: toma.medicamento_id,
              programada_para: new Date(programadaPara).toISOString(),
              ...(nota.trim() ? { nota: nota.trim() } : {}),
            },
            {
              onSuccess: onCerrar,
              onError: () => {
                manejarErrorEnModal(
                  crear,
                  'La toma se movió pero no pudo recrearse. Verifica la fecha e inténtalo de nuevo.',
                )
              },
            },
          )
        },
        onError: () => {
          manejarErrorEnModal(
            eliminar,
            'No se pudo mover la toma (eliminación rechazada).',
          )
        },
      })
      return
    }

    // Solo nota: PATCH directo.
    actualizar.mutate(
      { id: toma.id, datos: { nota: nota.trim() || undefined } },
      {
        onSuccess: onCerrar,
        onError: () => {
          manejarErrorEnModal(
            actualizar,
            'No se pudo guardar el cambio.',
          )
        },
      },
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
        aria-labelledby="titulo-editar-toma"
        className="relative w-full max-w-md rounded-lg border border-salvia-200 bg-white p-6 shadow-lg"
      >
        <h2
          id="titulo-editar-toma"
          className="font-display text-lg font-semibold text-pino-900"
        >
          Editar toma
        </h2>
        <p className="mt-1 text-sm/6 text-salvia-700">
          Ajusta la fecha/hora o la nota del registro puntual.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label
              htmlFor="toma-editar-fecha"
              className="block text-sm font-medium text-pino-900"
            >
              Programada para
            </label>
            <Input
              id="toma-editar-fecha"
              type="datetime-local"
              required
              value={programadaPara}
              onChange={(evento) => setProgramadaPara(evento.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="toma-editar-nota"
              className="block text-sm font-medium text-pino-900"
            >
              Nota <span className="text-salvia-500">(opcional)</span>
            </label>
            <Input
              id="toma-editar-nota"
              value={nota}
              onChange={(evento) => setNota(evento.target.value)}
            />
          </div>

          {enCurso && cambioFecha && (
            <Alert variant="info">
              Al cambiar la fecha, la toma se mueve: se elimina la actual y se
              crea en la nueva fecha/hora.
            </Alert>
          )}

          {(actualizar.isError || eliminar.isError || crear.isError) && (
            <Alert variant="error">
              No se pudo guardar el cambio. Intenta de nuevo.
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={onCerrar}
              disabled={enCurso}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={enCurso}>
              {enCurso ? (
                <Spinner size="sm" label="Guardando…" />
              ) : cambioFecha ? (
                'Mover toma'
              ) : (
                'Guardar'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
