import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Td, Table, Th } from '@/components/ui/table'
import { IconoAlertas } from '@/lib/iconos'
import { formatFechaHora } from '@/lib/format'
import { useAdultos } from '@/features/usuarios'

import { useAlertas, type Alerta } from '../api/alertas.api'


export function AlertasAdminPage() {
  const adultos = useAdultos()
  const [adultoFiltro, setAdultoFiltro] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')

  const params = useMemo(
    () => ({
      ...(adultoFiltro ? { adultoId: adultoFiltro } : {}),
      ...(estadoFiltro ? { estado: estadoFiltro } : {}),
      limite: 200,
    }),
    [adultoFiltro, estadoFiltro],
  )

  const alertas = useAlertas(params)

  /** Nombre del adulto por id (map de la lista de usuarios). */
  const nombreAdulto = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const a of adultos.data ?? []) {
      mapa.set(a.id, `${a.nombre} ${a.apellido}`)
    }
    return mapa
  }, [adultos.data])

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-pino-900">
          <IconoAlertas size={24} className="text-pino-600" />
          Alertas de los adultos
        </h1>
      </div>

      <p className="max-w-2xl text-sm/6 text-salvia-700">
        Todas las alertas generadas por los adultos mayores del sistema:
        caídas, SOS, zonas seguras, medicamentos e inactividad.
      </p>

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-salvia-200 bg-white p-4 shadow-sm">
        <div>
          <label
            htmlFor="filtro-alerta-adulto"
            className="text-xs font-medium text-salvia-600"
          >
            Adulto
          </label>
          <select
            id="filtro-alerta-adulto"
            value={adultoFiltro}
            onChange={(e) => setAdultoFiltro(e.target.value)}
            className="mt-1 rounded-md border border-salvia-300 bg-white px-3 py-2 text-sm text-pino-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600"
          >
            <option value="">Todos</option>
            {(adultos.data ?? []).map((adulto) => (
              <option key={adulto.id} value={adulto.id}>
                {adulto.nombre} {adulto.apellido}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="filtro-alerta-estado"
            className="text-xs font-medium text-salvia-600"
          >
            Estado
          </label>
          <select
            id="filtro-alerta-estado"
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="mt-1 rounded-md border border-salvia-300 bg-white px-3 py-2 text-sm text-pino-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600"
          >
            <option value="">Todos</option>
            <option value="ABIERTA">Abierta</option>
            <option value="EN_ATENCION">En atención</option>
            <option value="RESUELTA">Resuelta</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-salvia-200 bg-white shadow-sm">
        {alertas.isPending ? (
          <div className="flex items-center justify-center gap-3 p-10 text-sm text-salvia-600">
            <Spinner size="sm" label="Cargando alertas" />
            Cargando alertas…
          </div>
        ) : alertas.isError ? (
          <div className="space-y-3 p-6">
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            >
              No se pudieron cargar las alertas. Verifica tu conexión e intenta
              de nuevo.
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void alertas.refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : alertas.data.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-pino-900">
              No hay alertas que coincidan
            </p>
            <p className="mt-1 text-sm text-salvia-600">
              Ajusta o limpia los filtros para ver más resultados.
            </p>
          </div>
        ) : (
          <TablaAlertas alertas={alertas.data} nombreAdulto={nombreAdulto} />
        )}
      </div>
    </section>
  )
}

type SeveridadClases = Record<Alerta['severidad'], string>

const clasesSeveridad: SeveridadClases = {
  CRITICA: 'bg-red-100 text-red-800',
  ALTA: 'bg-amber-100 text-amber-800',
  MEDIA: 'bg-salvia-100 text-salvia-700',
  BAJA: 'bg-salvia-100 text-salvia-600',
}

type EstadoClases = Record<Alerta['estado'], string>

const clasesEstado: EstadoClases = {
  ABIERTA: 'bg-red-100 text-red-800',
  EN_ATENCION: 'bg-amber-100 text-amber-800',
  RESUELTA: 'bg-pino-100 text-pino-800',
  CANCELADA: 'bg-salvia-100 text-salvia-600',
}

function TablaAlertas({
  alertas,
  nombreAdulto,
}: {
  alertas: Alerta[]
  nombreAdulto: Map<string, string>
}) {
  return (
    <Table>
      <thead>
        <tr>
          <Th>Fecha</Th>
          <Th>Adulto</Th>
          <Th>Tipo</Th>
          <Th>Título</Th>
          <Th>Severidad</Th>
          <Th>Estado</Th>
        </tr>
      </thead>
      <tbody>
        {alertas.map((alerta) => (
          <tr key={alerta.id} className="hover:bg-salvia-50">
            <Td className="whitespace-nowrap text-xs">
              {formatFechaHora(alerta.ocurrida_en)}
            </Td>
            <Td className="font-medium">
              {nombreAdulto.get(alerta.adulto_id) ?? alerta.adulto_id}
            </Td>
            <Td className="text-xs">{alerta.tipo}</Td>
            <Td className="max-w-64 truncate">{alerta.titulo}</Td>
            <Td>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${clasesSeveridad[alerta.severidad]}`}
              >
                {alerta.severidad}
              </span>
            </Td>
            <Td>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${clasesEstado[alerta.estado]}`}
              >
                {alerta.estado.toLowerCase()}
              </span>
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
