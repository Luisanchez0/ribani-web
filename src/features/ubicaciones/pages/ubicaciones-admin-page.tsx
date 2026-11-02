import { useMemo, useState } from 'react'

import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { useAdultos } from '@/features/usuarios'
import { useZonasSeguras } from '@/features/zonas-seguras'
import { formatFechaHora } from '@/lib/format'
import { BARRA_FILTROS } from '@/lib/clases-filtros'
import { IconoUbicaciones } from '@/lib/iconos'

import { DetalleUbicacion, EstadoStreamBadge } from '../components/estado-ubicacion'
import { MapaAdultos } from '../components/mapa-ubicacion'
import {
  useUbicacionActual,
  useUltimasUbicaciones,
  useUbicacionesStream,
} from '../hooks'

export function UbicacionesAdminPage() {
  const adultos = useAdultos()
  const ultimas = useUltimasUbicaciones()
  const [adultoSeleccionado, setAdultoSeleccionado] = useState('')
  const activos = useMemo(
    () => (adultos.data ?? []).filter((adulto) => adulto.activo),
    [adultos.data],
  )
  const seleccionado = activos.find((adulto) => adulto.id === adultoSeleccionado)
  const adultoId = seleccionado?.id ?? ''
  const stream = useUbicacionesStream(adultoId)
  const actual = useUbicacionActual(adultoId)
  const zonas = useZonasSeguras(adultoId || undefined)

  const ubicaciones = useMemo(() => {
    const ids = new Set(activos.map((adulto) => adulto.id))
    const filas = (ultimas.data ?? []).filter((fila) =>
      ids.has(fila.adulto_id) && (!adultoId || fila.adulto_id === adultoId),
    )
    const reporte = actual.data
    if (!seleccionado || !reporte || reporte.adulto_id !== adultoId) return filas
    const anterior = filas.find((fila) => fila.adulto_id === adultoId)
    if (anterior && Date.parse(anterior.registrada_en) > Date.parse(reporte.registrada_en)) {
      return filas
    }
    return [{ ...reporte, nombre: seleccionado.nombre, apellido: seleccionado.apellido }]
  }, [activos, ultimas.data, actual.data, seleccionado, adultoId])

  const zonasVisibles = (zonas.data ?? []).filter((zona) =>
    zona.activa && activos.some((adulto) => adulto.id === zona.adulto_id) &&
    (!adultoId || zona.adulto_id === adultoId),
  )
  const sinUbicacion = activos.filter((adulto) =>
    (!adultoId || adulto.id === adultoId) &&
    !ubicaciones.some((fila) => fila.adulto_id === adulto.id),
  )

  return (
    <section className="space-y-6">
      <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-pino-900">
        <IconoUbicaciones size={24} className="text-pino-600" />
        Ubicación de los adultos
      </h1>
      <p className="max-w-2xl text-sm/6 text-salvia-700">
        Última ubicación conocida y zonas seguras activas en un solo mapa.
        La vista de todos se actualiza cada 30 segundos; selecciona un adulto
        para seguir sus reportes en tiempo real.
      </p>

      <div className={BARRA_FILTROS}>
        <label htmlFor="selector-adulto-admin" className="col-span-full block text-sm font-medium text-pino-900">
          Adulto mayor
        </label>
        <Select
          id="selector-adulto-admin"
          value={adultoId}
          disabled={adultos.isPending || adultos.isError}
          onChange={(evento) => setAdultoSeleccionado(evento.target.value)}
          className="col-span-full"
        >
          <option value="">Todos</option>
          {activos.map((adulto) => (
            <option key={adulto.id} value={adulto.id}>
              {adulto.nombre} {adulto.apellido}
            </option>
          ))}
        </Select>
      </div>

      {(adultos.isPending || ultimas.isPending) && (
        <div role="status" className="flex items-center gap-3 text-sm text-salvia-600">
          <Spinner size="sm" label="Cargando ubicaciones" />
          Cargando adultos y ubicaciones…
        </div>
      )}
      {(adultos.isError || ultimas.isError) && (
        <div role="alert" className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No se pudieron cargar todos los adultos o sus ubicaciones. Verifica tu conexión e intenta de nuevo.
        </div>
      )}
      {adultoId && actual.isError && (
        <p role="alert" className="text-sm text-amber-900">
          No se pudo consultar el reporte individual. Se muestra la última
          ubicación disponible mientras llegan nuevos reportes.
        </p>
      )}
      {zonas.isPending && (
        <p role="status" className="text-sm text-salvia-600">Cargando zonas seguras…</p>
      )}
      {zonas.isError && (
        <p role="alert" className="text-sm text-amber-900">
          No se pudieron cargar las zonas seguras. Las ubicaciones siguen disponibles.
        </p>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-pino-900">
            {seleccionado ? `${seleccionado.nombre} ${seleccionado.apellido}` : 'Todos los adultos'}
          </h2>
          {adultoId && <EstadoStreamBadge estado={stream.estado} />}
        </div>
        <MapaAdultos adultos={ubicaciones} zonasSeguras={zonasVisibles} />
        <p className="text-xs text-salvia-600">
          Marcadores verdes: última ubicación conocida. Círculos azules: zonas seguras activas.
          { !zonas.isPending && !zonas.isError && zonasVisibles.length === 0 && ' No hay zonas seguras activas para esta selección.' }
        </p>
      </div>

      {adultoId && actual.data && (
        <DetalleUbicacion ubicacion={actual.data} ultimoEventoEn={stream.ultimoEventoEn} />
      )}
      {ubicaciones.length > 0 && (
        <ul className="divide-y divide-salvia-100 rounded-lg border border-salvia-200 bg-white shadow-sm">
          {ubicaciones.map((fila) => (
            <li key={fila.adulto_id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
              <span className="font-medium text-pino-900">{fila.nombre} {fila.apellido}</span>
              <span className="text-xs text-salvia-600">
                Último reporte: {formatFechaHora(fila.registrada_en)} · {fila.fuente}
              </span>
            </li>
          ))}
        </ul>
      )}
      {!adultos.isPending && !adultos.isError && activos.length === 0 && (
        <p className="text-sm text-salvia-600">No hay adultos mayores activos.</p>
      )}
      {!ultimas.isPending && !ultimas.isError && sinUbicacion.length > 0 && (
        <p className="text-sm text-salvia-600">
          Sin ubicación reportada todavía: {sinUbicacion.map((adulto) => `${adulto.nombre} ${adulto.apellido}`).join(', ')}.
        </p>
      )}
    </section>
  )
}
