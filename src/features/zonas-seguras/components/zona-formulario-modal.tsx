import { useState } from 'react'
import type { FormEvent } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useMisAdultos } from '@/features/familiares'
import { useUbicacionActual } from '@/features/ubicaciones/hooks'

import {
  useActualizarZonaSegura,
  useCrearZonaSegura,
} from '../hooks/use-zonas-seguras'
import { RADIO_MAX_METROS, RADIO_MIN_METROS } from '../types'
import type { ZonaSegura } from '../types'

import { SelectorZonaMapa } from './selector-zona-mapa'

type ZonaFormularioModalProps = {
  abierto: boolean
  /** Zona a editar; null = modo creación. */
  zonaEditar: ZonaSegura | null
  onCerrar: () => void
}

/** Convierte el campo numérico a número o null si no es válido. */
function aNumero(valor: string): number | null {
  const limpio = valor.trim().replace(',', '.')
  if (limpio === '') return null
  const numero = Number(limpio)
  return Number.isFinite(numero) ? numero : null
}

export function ZonaFormularioModal({
  abierto,
  zonaEditar,
  onCerrar,
}: ZonaFormularioModalProps) {
  const adultos = useMisAdultos()
  const crear = useCrearZonaSegura()
  const actualizar = useActualizarZonaSegura()

  const mutacion = zonaEditar ? actualizar : crear
  const enCurso = crear.isPending || actualizar.isPending

  const adultosActivos = (adultos.data ?? []).filter((a) => a.estado === 'ACTIVA')

  const [adultoId, setAdultoId] = useState('')
  const [nombre, setNombre] = useState(zonaEditar?.nombre ?? '')
  const [latitud, setLatitud] = useState(
    zonaEditar ? String(zonaEditar.latitud_centro) : '',
  )
  const [longitud, setLongitud] = useState(
    zonaEditar ? String(zonaEditar.longitud_centro) : '',
  )
  const [radio, setRadio] = useState(
    zonaEditar ? String(zonaEditar.radio_metros) : '200',
  )
  const [notificarSalida, setNotificarSalida] = useState(
    zonaEditar?.notificar_salida ?? true,
  )
  const [notificarEntrada, setNotificarEntrada] = useState(
    zonaEditar?.notificar_entrada ?? false,
  )
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null)

  // Última ubicación del adulto elegido, para centrar la zona sin escribir coordenadas.
  const ubicacion = useUbicacionActual(adultoId, !zonaEditar)

  if (!abierto) return null

  function usarUltimaUbicacion() {
    if (ubicacion.data) {
      setLatitud(ubicacion.data.latitud.toFixed(6))
      setLongitud(ubicacion.data.longitud.toFixed(6))
    }
  }

  function seleccionarEnMapa(latitudMapa: number, longitudMapa: number) {
    setLatitud(latitudMapa.toFixed(6))
    setLongitud(longitudMapa.toFixed(6))
  }

  function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    const latitudNumero = aNumero(latitud)
    const longitudNumero = aNumero(longitud)
    const radioNumero = aNumero(radio)

    if (latitudNumero === null || latitudNumero < -90 || latitudNumero > 90) {
      setErrorValidacion('La latitud debe estar entre -90 y 90.')
      return
    }
    if (longitudNumero === null || longitudNumero < -180 || longitudNumero > 180) {
      setErrorValidacion('La longitud debe estar entre -180 y 180.')
      return
    }
    if (
      radioNumero === null ||
      !Number.isInteger(radioNumero) ||
      radioNumero < RADIO_MIN_METROS ||
      radioNumero > RADIO_MAX_METROS
    ) {
      setErrorValidacion(
        `El radio debe ser un número entero de ${RADIO_MIN_METROS} a ${RADIO_MAX_METROS} metros.`,
      )
      return
    }

    setErrorValidacion(null)

    const datosComunes = {
      nombre: nombre.trim(),
      latitud_centro: latitudNumero,
      longitud_centro: longitudNumero,
      radio_metros: radioNumero,
      notificar_salida: notificarSalida,
      notificar_entrada: notificarEntrada,
    }

    if (zonaEditar) {
      actualizar.mutate(
        { id: zonaEditar.id, datos: datosComunes },
        { onSuccess: onCerrar },
      )
      return
    }

    crear.mutate(
      { adulto_id: adultoId, ...datosComunes },
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
        aria-labelledby="titulo-zona-modal"
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-salvia-200 bg-white p-6 shadow-lg"
      >
        <h2
          id="titulo-zona-modal"
          className="font-display text-lg font-semibold text-pino-900"
        >
          {zonaEditar ? 'Editar zona segura' : 'Nueva zona segura'}
        </h2>
        <p className="mt-1 text-sm/6 text-salvia-700">
          Define un círculo alrededor de un punto. Te avisaremos cuando el
          adulto mayor salga o entre a la zona.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {!zonaEditar && (
            <div className="space-y-1.5">
              <label
                htmlFor="zona-adulto"
                className="block text-sm font-medium text-pino-900"
              >
                Adulto mayor
              </label>
              {adultos.isPending ? (
                <div className="flex items-center gap-3 py-2 text-sm text-salvia-600">
                  <Spinner size="sm" label="Cargando adultos" />
                  Cargando adultos…
                </div>
              ) : adultos.isError ? (
                <Alert variant="error">
                  No se pudo cargar la lista de adultos mayores.
                </Alert>
              ) : adultosActivos.length === 0 ? (
                <Alert variant="info">
                  No tienes adultos mayores vinculados activos.
                </Alert>
              ) : (
                <select
                  id="zona-adulto"
                  required
                  className="w-full rounded-md border border-salvia-300 bg-white px-3 py-2 text-sm text-pino-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600"
                  value={adultoId}
                  onChange={(evento) => setAdultoId(evento.target.value)}
                >
                  <option value="" disabled>
                    Selecciona un adulto mayor
                  </option>
                  {adultosActivos.map((adulto) => (
                    <option key={adulto.id} value={adulto.id}>
                      {adulto.nombre} {adulto.apellido}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="zona-nombre"
              className="block text-sm font-medium text-pino-900"
            >
              Nombre de la zona
            </label>
            <Input
              id="zona-nombre"
              required
              maxLength={100}
              placeholder="Casa, farmacia, parque…"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
            />
          </div>

          <SelectorZonaMapa
            latitud={aNumero(latitud)}
            longitud={aNumero(longitud)}
            radioMetros={aNumero(radio)}
            referenciaLatitud={ubicacion.data?.latitud ?? null}
            referenciaLongitud={ubicacion.data?.longitud ?? null}
            onSeleccionar={seleccionarEnMapa}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="zona-latitud"
                className="block text-sm font-medium text-pino-900"
              >
                Latitud
              </label>
              <Input
                id="zona-latitud"
                inputMode="decimal"
                required
                placeholder="19.432608"
                value={latitud}
                onChange={(evento) => setLatitud(evento.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="zona-longitud"
                className="block text-sm font-medium text-pino-900"
              >
                Longitud
              </label>
              <Input
                id="zona-longitud"
                inputMode="decimal"
                required
                placeholder="-99.133209"
                value={longitud}
                onChange={(evento) => setLongitud(evento.target.value)}
              />
            </div>
          </div>

          {!zonaEditar && adultoId && (
            <div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!ubicacion.data}
                onClick={usarUltimaUbicacion}
              >
                Usar última ubicación del adulto
              </Button>
              {ubicacion.data === null && (
                <p className="mt-1 text-xs text-salvia-600">
                  Aún no hay ubicación registrada para este adulto.
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="zona-radio"
              className="block text-sm font-medium text-pino-900"
            >
              Radio (metros)
            </label>
            <Input
              id="zona-radio"
              type="number"
              min={RADIO_MIN_METROS}
              max={RADIO_MAX_METROS}
              step={1}
              required
              value={radio}
              onChange={(evento) => setRadio(evento.target.value)}
            />
            <p className="text-xs text-salvia-600">
              Entre {RADIO_MIN_METROS} y {RADIO_MAX_METROS} metros.
            </p>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-pino-900">
              Notificar cuando el adulto
            </legend>
            <label className="flex items-center gap-2 text-sm text-pino-900">
              <input
                type="checkbox"
                checked={notificarSalida}
                onChange={(evento) => setNotificarSalida(evento.target.checked)}
              />
              Salga de la zona
            </label>
            <label className="flex items-center gap-2 text-sm text-pino-900">
              <input
                type="checkbox"
                checked={notificarEntrada}
                onChange={(evento) => setNotificarEntrada(evento.target.checked)}
              />
              Entre a la zona
            </label>
          </fieldset>

          {errorValidacion && <Alert variant="error">{errorValidacion}</Alert>}

          {mutacion.isError && (
            <Alert variant="error">
              No se pudo guardar la zona segura. Verifica los datos e intenta de
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
                  label={zonaEditar ? 'Guardando cambios…' : 'Creando zona…'}
                />
              ) : zonaEditar ? (
                'Guardar cambios'
              ) : (
                'Crear zona'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
