import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useActualizarHorario, useCrearHorario } from '../hooks'
import type { Horario, Medicamento } from '../types'

type HorarioFormularioModalProps = {
  abierto: boolean
  medicamento: Medicamento | null
  /** Horario a editar; null = modo creación. */
  horarioEditar: Horario | null
  onCerrar: () => void
}

/**
 * Días en formato del backend (ISO: 1 = lunes … 7 = domingo).
 * `todos` = sin selección explícita (el backend interpreta todos los días).
 */
const diasSemana = [
  { valor: 1, etiqueta: 'L', completa: 'Lunes' },
  { valor: 2, etiqueta: 'M', completa: 'Martes' },
  { valor: 3, etiqueta: 'X', completa: 'Miércoles' },
  { valor: 4, etiqueta: 'J', completa: 'Jueves' },
  { valor: 5, etiqueta: 'V', completa: 'Viernes' },
  { valor: 6, etiqueta: 'S', completa: 'Sábado' },
  { valor: 7, etiqueta: 'D', completa: 'Domingo' },
] as const

/** Orden ISO (1..7) para enviar días_semana al backend. */
function diasOrdenados(dias: Set<number>): number[] {
  return [...dias].sort((a, b) => a - b)
}

type RepeticionModo = 'diario' | 'ciclo'

/**
 * Convierte un modo + valor de horas al intervalo_minutos del backend.
 * - diario: una toma al día → sin intervalo (undefined).
 * - ciclo: repetición cada N horas → intervalo_minutos = N * 60.
 */
function intervaloDesdeModo(
  modo: RepeticionModo,
  horasCiclo: string,
): number | undefined {
  if (modo !== 'ciclo') return undefined
  const horas = Number(horasCiclo)
  if (!Number.isFinite(horas) || horas < 1) return undefined
  return Math.round(horas * 60)
}

/** Etiquetas rápidas de ventana; el input manual sigue permitido. */
const ventanasRapidas = [15, 30, 60, 120, 24 * 60] as const

/** Genera las próximas 3 tomas a partir de la configuración, para vista previa. */
function previsualizarTomas(
  horaLocal: string,
  modo: RepeticionModo,
  horasCiclo: string,
): string[] {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(horaLocal)) return []

  const [hora, minuto] = horaLocal.split(':').map(Number)
  const base = new Date()
  base.setHours(hora, minuto, 0, 0)

  if (modo === 'diario') {
    return [formatoHoraCorta(base)]
  }

  const horas = Number(horasCiclo)
  if (!Number.isFinite(horas) || horas < 1) return []

  const tomas: string[] = []
  const actual = new Date(base)
  while (tomas.length < 3) {
    tomas.push(formatoHoraCorta(actual))
    actual.setHours(actual.getHours() + Math.floor(horas))
    actual.setMinutes(actual.getMinutes() + Math.round((horas % 1) * 60))
  }
  return tomas
}

function formatoHoraCorta(fecha: Date): string {
  return `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`
}

/**
 * Modal de creación/edición de horario de un medicamento.
 * La validación respeta el contrato (CreateHorarioDto /
 * UpdateHorarioDto); la autorización real siempre es del server.
 *
 * Diseño guiado: en vez de pedir "intervalo en minutos", se elige
 * entre "una vez al día" o "cada X horas" y se muestra una vista
 * previa de las tomas que se generarán antes de guardar.
 *
 * El estado se inicializa perezosamente desde props y el padre remonta
 * el componente con una key distinta por horario (resetear estado vía
 * key, https://react.dev/learn/you-might-not-need-an-effect).
 */
export function HorarioFormularioModal({
  abierto,
  medicamento,
  horarioEditar,
  onCerrar,
}: HorarioFormularioModalProps) {
  const crear = useCrearHorario()
  const actualizar = useActualizarHorario()

  const mutacion = horarioEditar ? actualizar : crear
  const enCurso = crear.isPending || actualizar.isPending

  const [horaLocal, setHoraLocal] = useState(horarioEditar?.hora_local.slice(0, 5) ?? '')
  const [dias, setDias] = useState<Set<number>>(
    () => new Set(horarioEditar?.dias_semana ?? []),
  )

  // Modo de repetición derivado del horario que se edita (si hay).
  const modoInicial: RepeticionModo = horarioEditar?.intervalo_minutos
    ? 'ciclo'
    : 'diario'
  const [modo, setModo] = useState<RepeticionModo>(modoInicial)
  const [horasCiclo, setHorasCiclo] = useState(() =>
    horarioEditar?.intervalo_minutos
      ? String(horarioEditar.intervalo_minutos / 60)
      : '',
  )

  const [ventanaMinutos, setVentanaMinutos] = useState(
    horarioEditar?.ventana_minutos ? String(horarioEditar.ventana_minutos) : '',
  )

  const intervalo = useMemo(
    () => intervaloDesdeModo(modo, horasCiclo),
    [modo, horasCiclo],
  )

  const vistaPrevia = useMemo(
    () => previsualizarTomas(horaLocal, modo, horasCiclo),
    [horaLocal, modo, horasCiclo],
  )

  const textoDias =
    dias.size === 0 || dias.size === 7
      ? 'todos los días'
      : diasOrdenados(dias)
          .map(
            (d) => diasSemana.find((dia) => dia.valor === d)?.etiqueta ?? '?',
          )
          .join(', ')

  if (!abierto) return null

  function alternarDia(valor: number) {
    setDias((actual) => {
      const nuevo = new Set(actual)
      if (nuevo.has(valor)) {
        nuevo.delete(valor)
      } else {
        nuevo.add(valor)
      }
      return nuevo
    })
  }

  function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    if (!medicamento) return

    const datos = {
      hora_local: horaLocal,
      // Sin días marcados = todos los días (el backend lo interpreta).
      ...(dias.size > 0 ? { dias_semana: diasOrdenados(dias) } : {}),
      ...(intervalo ? { intervalo_minutos: intervalo } : {}),
      ...(ventanaMinutos ? { ventana_minutos: Number(ventanaMinutos) } : {}),
    }

    if (horarioEditar) {
      actualizar.mutate(
        {
          medicamentoId: medicamento.id,
          id: horarioEditar.id,
          datos,
        },
        { onSuccess: onCerrar },
      )
      return
    }

    crear.mutate(
      { medicamentoId: medicamento.id, datos },
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
        aria-labelledby="titulo-horario-modal"
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-salvia-200 bg-white p-6 shadow-lg"
      >
        <h2
          id="titulo-horario-modal"
          className="font-display text-lg font-semibold text-pino-900"
        >
          {horarioEditar ? 'Editar horario' : 'Nuevo horario'}
        </h2>
        <p className="mt-1 text-sm/6 text-salvia-700">
          Horario de toma de{' '}
          <span className="font-medium text-pino-900">
            {medicamento?.nombre}
          </span>
          .
        </p>

        <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
          {/* Paso 1: ¿cuándo empieza? */}
          <div className="space-y-1.5">
            <label
              htmlFor="horario-hora"
              className="block text-sm font-medium text-pino-900"
            >
              <span aria-hidden="true">1. </span>Primera toma del día
            </label>
            <div className="flex items-center gap-3">
              <Input
                id="horario-hora"
                type="time"
                required
                className="w-32"
                value={horaLocal}
                onChange={(evento) => setHoraLocal(evento.target.value)}
              />
              {vistaPrevia.length > 0 && (
                <div className="text-sm text-salvia-700">
                  {vistaPrevia.map((hora, indice) => (
                    <span
                      key={hora + indice}
                      className="inline-flex items-center rounded-full bg-pino-50 px-2.5 py-0.5 text-xs font-medium text-pino-800"
                    >
                      {hora}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-salvia-600">
              {modo === 'ciclo' && Number(horasCiclo) > 0
                ? 'Esta es la primera de las tomas del ciclo; las siguientes se reparten hacia adelante.'
                : 'Hora (24h) a la que se programa la toma.'}
            </p>
          </div>

          {/* Paso 2: ¿cada cuánto se repite? */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-pino-900">
              <span aria-hidden="true">2. </span>¿Cada cuánto se repite?
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm transition-colors ${
                  modo === 'diario'
                    ? 'border-pino-600 bg-pino-50'
                    : 'border-salvia-300 hover:bg-salvia-50'
                }`}
              >
                <input
                  type="radio"
                  name="modo-repeticion"
                  className="mt-0.5 accent-pino-600"
                  checked={modo === 'diario'}
                  onChange={() => setModo('diario')}
                />
                <span>
                  <span className="font-medium text-pino-900">
                    Una vez al día
                  </span>
                  <span className="block text-xs text-salvia-600">
                    P. ej. 1 pastilla todas las mañanas.
                  </span>
                </span>
              </label>
              <label
                className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm transition-colors ${
                  modo === 'ciclo'
                    ? 'border-pino-600 bg-pino-50'
                    : 'border-salvia-300 hover:bg-salvia-50'
                }`}
              >
                <input
                  type="radio"
                  name="modo-repeticion"
                  className="mt-0.5 accent-pino-600"
                  checked={modo === 'ciclo'}
                  onChange={() => setModo('ciclo')}
                />
                <span className="w-full">
                  <span className="font-medium text-pino-900">
                    Cada X horas
                  </span>
                  <span className="block text-xs text-salvia-600">
                    Se repite la toma en el mismo día.
                  </span>
                  {modo === 'ciclo' && (
                    <span className="mt-2 flex items-center gap-2">
                      <Input
                        id="horario-ciclo"
                        type="number"
                        min="1"
                        max="23"
                        placeholder="8"
                        aria-label="Repetir cada (horas)"
                        className="w-20"
                        value={horasCiclo}
                        onChange={(evento) => setHorasCiclo(evento.target.value)}
                      />
                      <span className="text-xs text-salvia-700">horas</span>
                    </span>
                  )}
                </span>
              </label>
            </div>
          </fieldset>

          {/* Paso 3: ¿qué días? */}
          <fieldset>
            <legend className="text-sm font-medium text-pino-900">
              <span aria-hidden="true">3. </span>¿Qué días se toma?
            </legend>
            <div className="mt-2 flex gap-1.5">
              {diasSemana.map(({ valor, etiqueta, completa }) => {
                const marcado = dias.has(valor)

                return (
                  <button
                    key={valor}
                    type="button"
                    aria-pressed={marcado}
                    aria-label={completa}
                    className={`h-9 w-9 rounded-md border text-sm font-semibold transition-colors ${
                      marcado
                        ? 'border-pino-600 bg-pino-600 text-white'
                        : 'border-salvia-300 bg-white text-pino-900 hover:bg-salvia-100'
                    }`}
                    onClick={() => alternarDia(valor)}
                  >
                    {etiqueta}
                  </button>
                )
              })}
            </div>
            <p className="mt-1.5 text-xs text-salvia-600">
              {dias.size === 0
                ? 'Sin marcar ninguno: se genera todos los días.'
                : `Se genera: ${textoDias}.`}
            </p>
          </fieldset>

          {/* Paso 4: margen para registrar la toma. */}
          <div className="space-y-2">
            <label
              htmlFor="horario-ventana"
              className="block text-sm font-medium text-pino-900"
            >
              <span aria-hidden="true">4. </span>Margen para registrar la toma{' '}
              <span className="text-salvia-500">(opcional)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ventanasRapidas.map((minutos) => (
                <button
                  key={minutos}
                  type="button"
                  aria-pressed={ventanaMinutos === String(minutos)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    ventanaMinutos === String(minutos)
                      ? 'border-pino-600 bg-pino-600 text-white'
                      : 'border-salvia-300 bg-white text-pino-900 hover:bg-salvia-100'
                  }`}
                  onClick={() => setVentanaMinutos(String(minutos))}
                >
                  {minutos >= 24 * 60 ? 'Todo el día' : `${minutos} min`}
                </button>
              ))}
            </div>
            <Input
              id="horario-ventana"
              type="number"
              min="1"
              className="w-32"
              placeholder="60"
              value={ventanaMinutos}
              onChange={(evento) => setVentanaMinutos(evento.target.value)}
            />
            <p className="text-xs text-salvia-600">
              Minutos después de la hora en que la app del adulto aún acepta
              marcarla como tomada. Si se deja vacío, el servidor usa 60 min.
            </p>
          </div>

          {mutacion.isError && (
            <Alert variant="error">
              No se pudieron guardar los cambios. Revisa los datos e intenta de
              nuevo.
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={onCerrar} disabled={enCurso}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enCurso}>
              {enCurso ? (
                <Spinner
                  size="sm"
                  label={
                    horarioEditar ? 'Guardando cambios…' : 'Creando horario…'
                  }
                />
              ) : horarioEditar ? (
                'Guardar cambios'
              ) : (
                'Crear horario'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
