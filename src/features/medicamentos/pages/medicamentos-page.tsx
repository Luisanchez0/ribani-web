import { useState } from 'react'
import type { FormEvent } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { IconoMedicamentos } from '@/lib/iconos'
import { Td, Table, Th } from '@/components/ui/table'
import { formatFecha } from '@/lib/format'
import { HorarioFormularioModal } from '../components/horario-formulario-modal'
import { MedicamentoFormularioModal } from '../components/medicamento-formulario-modal'
import { TomasPanel } from '../components/tomas-panel'
import {
  useActualizarHorario,
  useActualizarMedicamento,
  useCrearToma,
  useEliminarHorario,
  useEliminarMedicamento,
  useHorarios,
  useMedicamentos,
} from '../hooks'
import type { Horario, Medicamento } from '../types'

type BadgeProps = {
  activo: boolean
}

/** Estado del medicamento: no depender solo del color (ver AGENTS.md). */
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
      return 'No tienes permisos para administrar medicamentos.'
    }
  }

  return 'No se pudieron cargar los medicamentos. Verifica tu conexión e intenta de nuevo.'
}

/**
 * Panel de horarios de un medicamento (GET/POST/PATCH/DELETE
 * /medicamentos/{id}/horarios): lista los horarios con alta, edición,
 * baja y activar/desactivar.
 */
function PanelHorarios({
  medicamento,
  onCerrar,
}: {
  medicamento: Medicamento
  onCerrar: () => void
}) {
  const horarios = useHorarios(medicamento.id)
  const desactivar = useActualizarHorario()
  const eliminarHorario = useEliminarHorario()

  const [modalAbierto, setModalAbierto] = useState(false)
  const [horarioEditar, setHorarioEditar] = useState<Horario | null>(null)

  const ocupados = new Set<string>([
    ...(desactivar.isPending && desactivar.variables
      ? [desactivar.variables.id]
      : []),
    ...(eliminarHorario.isPending && eliminarHorario.variables
      ? [eliminarHorario.variables.id]
      : []),
  ])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar panel de horarios"
        className="absolute inset-0 cursor-default bg-pino-950/60"
        onClick={onCerrar}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-horarios-panel"
        className="relative flex max-h-[85vh] w-full max-w-xl flex-col rounded-lg border border-salvia-200 bg-white p-6 shadow-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="titulo-horarios-panel"
              className="font-display text-lg font-semibold text-pino-900"
            >
              Horarios de {medicamento.nombre}
            </h2>
            <p className="mt-1 text-sm/6 text-salvia-700">
              Defines cuándo se programa cada toma.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setHorarioEditar(null)
              setModalAbierto(true)
            }}
          >
            Nuevo horario
          </Button>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          {horarios.isPending ? (
            <div className="flex items-center justify-center gap-3 p-6 text-sm text-salvia-600">
              <Spinner size="sm" label="Cargando horarios" />
              Cargando horarios…
            </div>
          ) : horarios.isError ? (
            <Alert variant="error" className="p-4">
              No se pudieron cargar los horarios.
            </Alert>
          ) : horarios.data.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm font-medium text-pino-900">
                Sin horarios definidos
              </p>
              <p className="mt-1 text-sm text-salvia-600">
                Agrega al menos un horario para programar las tomas.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {horarios.data.map((horario) => {
                const ocupado = ocupados.has(horario.id)
                // ISO: 1 = lunes … 7 = domingo (contrato del backend).
                const abreviaturas = ['?', 'L', 'M', 'X', 'J', 'V', 'S', 'D']
                const diasTexto = horario.dias_semana?.length
                  ? horario.dias_semana
                      .map((d) => abreviaturas[d] ?? '?')
                      .join(' ')
                  : 'Todos los días'

                return (
                  <li
                    key={horario.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-salvia-200 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-pino-900">
                        {horario.hora_local}
                        {!horario.activo && (
                          <span className="ml-2 rounded-full bg-salvia-100 px-2 py-0.5 text-xs text-salvia-600">
                            Inactivo
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-salvia-600">
                        {diasTexto}
                        {horario.ventana_minutos
                          ? ` · ventana ${horario.ventana_minutos} min`
                          : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={ocupado}
                        onClick={() => {
                          setHorarioEditar(horario)
                          setModalAbierto(true)
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={ocupado}
                        onClick={() => {
                          desactivar.mutate({
                            medicamentoId: medicamento.id,
                            id: horario.id,
                            datos: { activo: !horario.activo },
                          })
                        }}
                      >
                        {horario.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={ocupado}
                        onClick={() => {
                          const confirmado = window.confirm(
                            `¿Eliminar el horario de las ${horario.hora_local}?`,
                          )
                          if (confirmado) {
                            eliminarHorario.mutate({
                              medicamentoId: medicamento.id,
                              id: horario.id,
                            })
                          }
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

        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={onCerrar}>
            Cerrar
          </Button>
        </div>

        <HorarioFormularioModal
          key={horarioEditar?.id ?? 'nuevo'}
          abierto={modalAbierto}
          medicamento={medicamento}
          horarioEditar={horarioEditar}
          onCerrar={() => {
            setModalAbierto(false)
            setHorarioEditar(null)
          }}
        />
      </div>
    </div>
  )
}

/**
 * Registrar una toma puntual (POST /tomas) desde un medicamento:
 * abre un mini formulario de fecha/hora y nota.
 */
function ModalTomaPuntual({
  medicamento,
  onCerrar,
}: {
  medicamento: Medicamento
  onCerrar: () => void
}) {
  const crearToma = useCrearToma()

  const ahora = new Date()
  const predeterminado = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}T${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`

  const [programadaPara, setProgramadaPara] = useState(predeterminado)
  const [nota, setNota] = useState('')

  function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    if (!medicamento) return

    crearToma.mutate(
      {
        medicamento_id: medicamento.id,
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
        aria-labelledby="titulo-toma-modal"
        className="relative w-full max-w-md rounded-lg border border-salvia-200 bg-white p-6 shadow-lg"
      >
        <h2
          id="titulo-toma-modal"
          className="font-display text-lg font-semibold text-pino-900"
        >
          Programar toma de {medicamento.nombre}
        </h2>
        <p className="mt-1 text-sm/6 text-salvia-700">
          Crea un registro puntual además de los horarios automáticos.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label
              htmlFor="toma-programada"
              className="block text-sm font-medium text-pino-900"
            >
              Programada para
            </label>
            <Input
              id="toma-programada"
              type="datetime-local"
              required
              value={programadaPara}
              onChange={(evento) => setProgramadaPara(evento.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="toma-nota"
              className="block text-sm font-medium text-pino-900"
            >
              Nota <span className="text-salvia-500">(opcional)</span>
            </label>
            <Input
              id="toma-nota"
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
            <Button type="submit" disabled={crearToma.isPending}>
              {crearToma.isPending ? (
                <Spinner size="sm" label="Programando toma…" />
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

/**
 * Medicamentos (/panel/medicamentos).
 * Consumo real de GET /medicamentos mediante TanStack Query.
 * Las acciones (alta, edición, baja, tomas) ejecutan mutations contra
 * el backend.
 */
export function MedicamentosPage() {
  const medicamentos = useMedicamentos()
  const desactivar = useActualizarMedicamento()
  const eliminar = useEliminarMedicamento()

  const [modalAbierto, setModalAbierto] = useState(false)
  const [medicamentoEditar, setMedicamentoEditar] =
    useState<Medicamento | null>(null)
  const [medicamentoToma, setMedicamentoToma] = useState<Medicamento | null>(
    null,
  )
  const [medicamentoHorarios, setMedicamentoHorarios] =
    useState<Medicamento | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  const ocupados = new Set<string>([
    ...(desactivar.isPending && desactivar.variables
      ? [desactivar.variables.id]
      : []),
    ...(eliminar.isPending && eliminar.variables ? [eliminar.variables] : []),
  ])

  function desactivarMedicamento(medicamento: Medicamento) {
    const confirmado = window.confirm(
      `¿Marcar como inactivo el medicamento ${medicamento.nombre}?`,
    )

    if (!confirmado) return

    setErrorAccion(null)
    desactivar.mutate(
      { id: medicamento.id, datos: { activo: false } },
      {
        onError: () =>
          setErrorAccion(
            `No se pudo desactivar el medicamento ${medicamento.nombre}.`,
          ),
      },
    )
  }

  function eliminarMedicamento(medicamento: Medicamento) {
    const confirmado = window.confirm(
      `¿Eliminar definitivamente el medicamento ${medicamento.nombre}? Esta acción no se puede deshacer.`,
    )

    if (!confirmado) return

    setErrorAccion(null)
    eliminar.mutate(medicamento.id, {
      onError: () =>
        setErrorAccion(
          `No se pudo eliminar el medicamento ${medicamento.nombre}.`,
        ),
    })
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-pino-900">
          <IconoMedicamentos size={24} className="text-pino-600" />
          Medicamentos
        </h1>

        <Button
          onClick={() => {
            setMedicamentoEditar(null)
            setModalAbierto(true)
          }}
        >
          Nuevo medicamento
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
        {medicamentos.isPending ? (
          <div className="flex items-center justify-center gap-3 p-10 text-sm text-salvia-600">
            <Spinner size="sm" label="Cargando medicamentos" />
            Cargando medicamentos…
          </div>
        ) : medicamentos.isError ? (
          <div className="space-y-3 p-6">
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            >
              {mensajeDeError(medicamentos.error)}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void medicamentos.refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : medicamentos.data.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-pino-900">
              No hay medicamentos registrados
            </p>
            <p className="mt-1 text-sm text-salvia-600">
              Agrega los medicamentos del adulto mayor para programar sus
              tomas.
            </p>
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Nombre</Th>
                <Th>Dosis</Th>
                <Th>Instrucciones</Th>
                <Th>Inicio</Th>
                <Th>Estado</Th>
                <Th>
                  <span className="sr-only">Acciones</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {medicamentos.data.map((medicamento) => {
                const ocupado = ocupados.has(medicamento.id)

                return (
                  <tr key={medicamento.id} className="hover:bg-salvia-50">
                    <Td className="font-medium">{medicamento.nombre}</Td>
                    <Td>
                      {medicamento.dosis} {medicamento.unidad_dosis}
                    </Td>
                    <Td>{medicamento.instrucciones ?? '—'}</Td>
                    <Td>{formatFecha(medicamento.fecha_inicio)}</Td>
                    <Td>
                      <BadgeEstado activo={medicamento.activo} />
                    </Td>
                    <Td>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={ocupado}
                          onClick={() => setMedicamentoToma(medicamento)}
                        >
                          Programar toma
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={ocupado}
                          onClick={() => setMedicamentoHorarios(medicamento)}
                        >
                          Horarios
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={ocupado}
                          onClick={() => {
                            setErrorAccion(null)
                            setMedicamentoEditar(medicamento)
                            setModalAbierto(true)
                          }}
                        >
                          Editar
                        </Button>
                        {medicamento.activo && (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={ocupado}
                            onClick={() => desactivarMedicamento(medicamento)}
                          >
                            Desactivar
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={ocupado}
                          onClick={() => eliminarMedicamento(medicamento)}
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

      {/* key distinta por modo/medicamento: remonta y reinicia los formularios. */}
      <MedicamentoFormularioModal
        key={medicamentoEditar?.id ?? 'nuevo'}
        abierto={modalAbierto}
        medicamentoEditar={medicamentoEditar}
        onCerrar={() => {
          setModalAbierto(false)
          setMedicamentoEditar(null)
        }}
      />
      {medicamentoToma && (
        <ModalTomaPuntual
          key={`toma-${medicamentoToma.id}`}
          medicamento={medicamentoToma}
          onCerrar={() => setMedicamentoToma(null)}
        />
      )}
      {medicamentoHorarios && (
        <PanelHorarios
          key={`horarios-${medicamentoHorarios.id}`}
          medicamento={medicamentoHorarios}
          onCerrar={() => setMedicamentoHorarios(null)}
        />
      )}

      {/* Sección de tomas: gestión de los registros concretos que dispara
          el cron + puntuales (ver, filtrar, tomar/omitar, mover, borrar). */}
      {!medicamentos.isPending && !medicamentos.isError && (
        <TomasPanel medicamentos={medicamentos} />
      )}
    </section>
  )
}