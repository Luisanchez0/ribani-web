import { useMemo, useState } from 'react'

import { Spinner } from '@/components/ui/spinner'
import { useAdultos } from '@/features/usuarios'
import { formatFechaHora } from '@/lib/format'
import { IconoUbicaciones } from '@/lib/iconos'

import { DetalleUbicacion, EstadoStreamBadge } from '../components/estado-ubicacion'
import { MapaAdultos, MapaUbicacion } from '../components/mapa-ubicacion'
import {
  useUbicacionActual,
  useUltimasUbicaciones,
  useUbicacionesStream,
} from '../hooks'


export function UbicacionesAdminPage() {
  const adultos = useAdultos()
  const ultimas = useUltimasUbicaciones()
  const [adultoSeleccionado, setAdultoSeleccionado] = useState<string | null>(
    null,
  )
  const [seguir, setSeguir] = useState(true)

  const activos = useMemo(
    () => (adultos.data ?? []).filter((a) => a.activo),
    [adultos.data],
  )


  const adultoId =
    adultoSeleccionado && activos.some((a) => a.id === adultoSeleccionado)
      ? adultoSeleccionado
      : (activos[0]?.id ?? '')

  const stream = useUbicacionesStream(adultoId)
  const actual = useUbicacionActual(adultoId)

  /** Adultos activos que todavía no han reportado ninguna ubicación. */
  const sinUbicacion = useMemo(() => {
    const conUbicacion = new Set(
      (ultimas.data ?? []).map((fila) => fila.adulto_id),
    )
    return activos.filter((adulto) => !conUbicacion.has(adulto.id))
  }, [activos, ultimas.data])

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-pino-900">
          <IconoUbicaciones size={24} className="text-pino-600" />
          Ubicación de los adultos
        </h1>
      </div>

      <p className="max-w-2xl text-sm/6 text-salvia-700">
        Mapa con la última ubicación conocida de todos los adultos mayores
        activos del sistema, y detalle en vivo del adulto que elijas.
      </p>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-pino-900">
          Todos los adultos
        </h2>

        {ultimas.isPending ? (
          <div className="flex items-center justify-center gap-3 rounded-lg border border-salvia-200 bg-white p-10 text-sm text-salvia-600">
            <Spinner size="sm" label="Cargando ubicaciones" />
            Buscando la última ubicación de cada adulto…
          </div>
        ) : ultimas.isError ? (
          <div
            role="alert"
            className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            No se pudieron cargar las ubicaciones de todos los adultos. Verifica
            tu conexión e intenta de nuevo.
          </div>
        ) : (
          <>
            <MapaAdultos adultos={ultimas.data ?? []} />

            {(ultimas.data ?? []).length > 0 && (
              <ul className="divide-y divide-salvia-100 rounded-lg border border-salvia-200 bg-white shadow-sm">
                {(ultimas.data ?? []).map((fila) => (
                  <li
                    key={fila.adulto_id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
                  >
                    <span className="font-medium text-pino-900">
                      {fila.nombre} {fila.apellido}
                    </span>
                    <span className="text-xs text-salvia-600">
                      Último reporte: {formatFechaHora(fila.registrada_en)} ·{' '}
                      {fila.fuente}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {sinUbicacion.length > 0 && (
              <p className="text-sm text-salvia-600">
                Sin ubicación reportada todavía:{' '}
                {sinUbicacion
                  .map((adulto) => `${adulto.nombre} ${adulto.apellido}`)
                  .join(', ')}
                .
              </p>
            )}
          </>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-pino-900">
            Detalle de un adulto
          </h2>
          {adultoId && <EstadoStreamBadge estado={stream.estado} />}
        </div>

        {adultos.isPending ? (
          <div className="flex items-center gap-3 rounded-lg border border-salvia-200 bg-white p-6 text-sm text-salvia-600">
            <Spinner size="sm" label="Cargando adultos" />
            Cargando adultos…
          </div>
        ) : adultos.isError ? (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          >
            No se pudieron cargar los adultos del sistema. Verifica tu conexión e
            intenta de nuevo.
          </div>
        ) : activos.length === 0 ? (
          <div className="rounded-lg border border-salvia-200 bg-white p-10 text-center">
            <p className="text-sm font-medium text-pino-900">
              No hay adultos mayores activos
            </p>
            <p className="mt-1 text-sm text-salvia-600">
              Crea cuentas con rol ADULTO_MAYOR desde Usuarios para poder
              supervisar su ubicación.
            </p>
          </div>
        ) : (
          <>
            {activos.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor="selector-adulto-admin"
                  className="text-sm font-medium text-pino-900"
                >
                  Adulto:
                </label>
                <select
                  id="selector-adulto-admin"
                  value={adultoId}
                  onChange={(evento) => {
                    setSeguir(true)
                    setAdultoSeleccionado(evento.target.value)
                  }}
                  className="w-64 rounded-md border border-salvia-300 bg-white px-3 py-2 text-sm text-pino-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600"
                >
                  {activos.map((adulto) => (
                    <option key={adulto.id} value={adulto.id}>
                      {adulto.nombre} {adulto.apellido}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {actual.isPending ? (
              <div className="flex items-center justify-center gap-3 rounded-lg border border-salvia-200 bg-white p-10 text-sm text-salvia-600">
                <Spinner size="sm" label="Cargando última ubicación" />
                Buscando la última ubicación conocida…
              </div>
            ) : actual.isError ? (
              <div
                role="alert"
                className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              >
                No se pudo cargar la última ubicación conocida. El mapa mostrará
                el primer reporte que llegue en tiempo real.
              </div>
            ) : actual.data === null ? (
              <div className="rounded-lg border border-salvia-200 bg-white p-10 text-center">
                <p className="text-sm font-medium text-pino-900">
                  Aún no hay una ubicación registrada
                </p>
                <p className="mt-1 text-sm text-salvia-600">
                  Cuando{' '}
                  {activos.find((a) => a.id === adultoId)?.nombre ?? 'el adulto'}{' '}
                  reporte su ubicación desde su aplicación, aparecerá aquí en
                  tiempo real.
                </p>
              </div>
            ) : (
              <>
                <MapaUbicacion
                  ubicacion={actual.data}
                  seguir={seguir}
                  onSeguirChange={setSeguir}
                />

                <DetalleUbicacion
                  ubicacion={actual.data}
                  ultimoEventoEn={stream.ultimoEventoEn}
                />
              </>
            )}
          </>
        )}
      </div>
    </section>
  )
}
