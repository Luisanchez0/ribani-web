import { useMemo, useState } from 'react'

import { Spinner } from '@/components/ui/spinner'
import { useMisAdultos } from '@/features/familiares'
import { IconoUbicaciones } from '@/lib/iconos'

import { DetalleUbicacion, EstadoStreamBadge } from '../components/estado-ubicacion'
import { MapaUbicacion } from '../components/mapa-ubicacion'
import { useUbicacionActual } from '../hooks'
import { useUbicacionesStream } from '../hooks/use-ubicaciones-stream'



export function UbicacionesPage() {
  const adultos = useMisAdultos()
  const [adultoSeleccionado, setAdultoSeleccionado] = useState<string | null>(
    null,
  )
  const [seguir, setSeguir] = useState(true)

  const activos = useMemo(
    () => (adultos.data ?? []).filter((a) => a.estado === 'ACTIVA'),
    [adultos.data],
  )


  
  const adultoId =
    adultoSeleccionado && activos.some((a) => a.id === adultoSeleccionado)
      ? adultoSeleccionado
      : (activos[0]?.id ?? '')

  const stream = useUbicacionesStream(adultoId)
  const actual = useUbicacionActual(adultoId)

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-pino-900">
          <IconoUbicaciones size={24} className="text-pino-600" />
          Ubicación en tiempo real
        </h1>
        {adultoId && <EstadoStreamBadge estado={stream.estado} />}
      </div>

      {/* Selector del adulto a monitorear */}
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
          No se pudieron cargar los adultos a tu cargo. Verifica tu conexión e
          intenta de nuevo.
        </div>
      ) : activos.length === 0 ? (
        <div className="rounded-lg border border-salvia-200 bg-white p-10 text-center">
          <p className="text-sm font-medium text-pino-900">
            No tienes adultos mayores vinculados
          </p>
          <p className="mt-1 text-sm text-salvia-600">
            La ubicación en tiempo real aparece en cuanto exista un vínculo
            activo con un adulto mayor.
          </p>
        </div>
      ) : (
        <>
          {activos.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="selector-adulto"
                className="text-sm font-medium text-pino-900"
              >
                Adulto:
              </label>
              <select
                id="selector-adulto"
                value={adultoId}
                onChange={(evento) => {
                  setSeguir(true)
                  setAdultoSeleccionado(evento.target.value)
                }}
                className="w-72 rounded-md border border-salvia-300 bg-white px-3 py-2 text-sm text-pino-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600"
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
            // 404 del backend: el adulto aún no reporta ubicación. Estado
            // normal, no error; el stream actualiza la vista al primer
            // reporte sin recargar.
            <div className="rounded-lg border border-salvia-200 bg-white p-10 text-center">
              <p className="text-sm font-medium text-pino-900">
                Aún no hay una ubicación registrada
              </p>
              <p className="mt-1 text-sm text-salvia-600">
                Cuando {activos.find((a) => a.id === adultoId)?.nombre ?? 'el adulto'} abra
                su aplicación y reporte su ubicación, aparecerá aquí en tiempo real.
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
    </section>
  )
}
