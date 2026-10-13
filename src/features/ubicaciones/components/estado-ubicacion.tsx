import { formatFechaHora } from '@/lib/format'

import type { EstadoStream } from '../hooks/use-ubicaciones-stream'
import type { Ubicacion } from '../types'



export function EstadoStreamBadge({ estado }: { estado: EstadoStream }) {
  const config = {
    conectando: {
      texto: 'Conectando…',
      clases: 'bg-salvia-100 text-salvia-700',
      punto: 'bg-salvia-400',
    },
    conectado: {
      texto: 'En tiempo real',
      clases: 'bg-pino-100 text-pino-800',
      punto: 'bg-pino-600 animate-pulse-slow',
    },
    error: {
      texto: 'Reconectando…',
      clases: 'bg-amber-100 text-amber-800',
      punto: 'bg-amber-500',
    },
  }[estado]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${config.clases}`}
      role="status"
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${config.punto}`} />
      {config.texto}
    </span>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-salvia-600">{etiqueta}</dt>
      <dd className="mt-0.5 truncate text-sm text-pino-950">{valor}</dd>
    </div>
  )
}

export function DetalleUbicacion({
  ubicacion,
  ultimoEventoEn,
}: {
  ubicacion: Ubicacion | null
  ultimoEventoEn: string | null
}) {
  if (!ubicacion) {
    return (
      <div className="rounded-lg border border-salvia-200 bg-white p-4">
        <p className="text-sm text-salvia-700">
          El adulto mayor aún no ha reportado ninguna ubicación. Aparecerá
          aquí en cuanto su dispositivo envíe un reporte.
        </p>
      </div>
    )
  }

  const enVivo =
    ultimoEventoEn !== null && ultimoEventoEn === ubicacion.registrada_en

  return (
    <div className="rounded-lg border border-salvia-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-pino-900">
          Última ubicación
        </h2>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            enVivo
              ? 'bg-pino-100 text-pino-800'
              : 'bg-salvia-100 text-salvia-600'
          }`}
        >
          {enVivo ? 'Recibida en tiempo real' : 'Última conocida'}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Dato
          etiqueta="Registrada"
          valor={formatFechaHora(ubicacion.registrada_en)}
        />
        <Dato
          etiqueta="Coordenadas"
          valor={`${ubicacion.latitud.toFixed(5)}, ${ubicacion.longitud.toFixed(5)}`}
        />
        <Dato
          etiqueta="Precisión"
          valor={
            ubicacion.precision_metros !== null
              ? `±${Math.round(ubicacion.precision_metros)} m`
              : '—'
          }
        />
        <Dato etiqueta="Fuente" valor={ubicacion.fuente} />
      </dl>
    </div>
  )
}
