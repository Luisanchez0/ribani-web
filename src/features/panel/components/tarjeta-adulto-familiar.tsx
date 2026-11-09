import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import type { AdultoVinculado } from '@/features/familiares'
import { useUbicacionActual } from '@/features/ubicaciones'
import { esCoordenadaValida, formatFechaHora } from '@/lib/format'
import { IconoUbicaciones } from '@/lib/iconos'

import { enlacePanel, tarjetaPanel } from './resumen-panel'

export function TarjetaAdultoFamiliar({ adulto, pendientes, errorAlertas, cargandoAlertas, conteoLimitado }: {
  adulto: AdultoVinculado
  pendientes: number
  errorAlertas: boolean
  cargandoAlertas: boolean
  conteoLimitado: boolean
}) {
  const ubicacion = useUbicacionActual(adulto.id, adulto.puede_ver_ubicacion)
  const reporte = ubicacion.data
  const valida = reporte && esCoordenadaValida(reporte.latitud, reporte.longitud)

  return (
    <article className={`${tarjetaPanel} flex min-w-0 flex-col`}>
      <header className="flex items-start gap-3">
        <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-pino-100 text-sm font-semibold text-pino-800">
          {adulto.nombre[0]}{adulto.apellido[0]}
        </span>
        <div className="min-w-0">
          <h3 className="break-words font-semibold text-pino-900">{adulto.nombre} {adulto.apellido}</h3>
          {adulto.parentesco && <p className="mt-0.5 text-sm text-salvia-700">{adulto.parentesco}</p>}
          {adulto.es_contacto_principal && <p className="mt-1 text-xs font-medium text-pino-700">Eres su contacto principal</p>}
        </div>
      </header>

      <div className="mt-4 rounded-lg bg-salvia-50 p-3">
        <p className="text-sm font-medium text-pino-900">Alertas pendientes</p>
        {cargandoAlertas ? <p className="mt-1 text-sm text-salvia-600">Cargando alertas…</p>
          : errorAlertas ? <p className="mt-1 text-sm text-amber-900">Resumen incompleto</p>
            : <p className={`mt-1 text-sm ${pendientes > 0 ? 'font-semibold text-red-800' : 'text-salvia-700'}`}>
              {pendientes}{conteoLimitado ? '+' : ''} abiertas o en atención
            </p>}
      </div>

      <div className="mt-4 flex-1 text-sm/6 text-salvia-700">
        <p className="flex items-center gap-2 font-medium text-pino-900"><IconoUbicaciones size={17} />Última ubicación conocida</p>
        {!adulto.puede_ver_ubicacion ? (
          <p className="mt-2">Tu vínculo no permite consultar su ubicación.</p>
        ) : ubicacion.isPending ? (
          <p role="status" className="mt-2 flex items-center gap-2"><Spinner size="sm" label="Cargando ubicación" />Buscando ubicación…</p>
        ) : ubicacion.isError ? (
          <div className="mt-2 space-y-2">
            <p role="alert" className="text-amber-900">No se pudo consultar la ubicación.</p>
            <Button variant="secondary" size="sm" onClick={() => void ubicacion.refetch()}>Reintentar ubicación</Button>
          </div>
        ) : reporte && valida ? (
          <div className="mt-2">
            <p className="tabular-nums">{reporte.latitud.toFixed(5)}, {reporte.longitud.toFixed(5)}</p>
            <p className="mt-1 text-xs text-salvia-600">Última actualización</p>
            <time dateTime={reporte.registrada_en} className="block text-sm font-medium text-pino-800">{formatFechaHora(reporte.registrada_en)}</time>
          </div>
        ) : (
          <p className="mt-2">{reporte ? 'El último reporte no tiene coordenadas válidas.' : 'Aún no tiene una ubicación registrada.'}</p>
        )}
      </div>
      <footer className="mt-4 flex flex-wrap gap-x-4 border-t border-salvia-200 pt-2">
        {adulto.puede_ver_ubicacion && <Link to="/panel/ubicaciones" className={enlacePanel}>Abrir ubicaciones</Link>}
        <Link to="/panel/familiares" className={enlacePanel}>Ver vínculo</Link>
      </footer>
    </article>
  )
}
