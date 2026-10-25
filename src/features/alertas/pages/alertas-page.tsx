import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Td, Table, Th } from '@/components/ui/table'
import { IconoAlertas } from '@/lib/iconos'
import {
  ANCHO_NORMAL,
  BARRA_FILTROS,
  CONTROL_FILTRO,
} from '@/lib/clases-filtros'
import { formatFechaHora } from '@/lib/format'
import { useAdultos } from '@/features/usuarios'
import { useMisAdultos } from '@/features/familiares'
import {
  useResumenWhatsapp,
  resumirWhatsapp,
  type ResumenWhatsapp,
} from '@/features/whatsapp'

import {
  useActualizarAlerta,
  useAlertas,
  useEliminarAlerta,
  type Alerta,
  type TransicionAlerta,
} from '../api/alertas.api'
import { useAlertasStream } from '../hooks/use-alertas-stream'

export function AlertasPage() {
  const adultos = useAdultos()
  const misAdultos = useMisAdultos()
  const whatsapp = useResumenWhatsapp()
  const actualizar = useActualizarAlerta()
  const eliminar = useEliminarAlerta()

  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [verHistorial, setVerHistorial] = useState(false)

  const params = useMemo(
    () => ({
      ...(estadoFiltro ? { estado: estadoFiltro } : {}),
      limite: 100,
    }),
    [estadoFiltro],
  )

  const alertas = useAlertas(params)

  // Tiempo real del panel: un stream SSE por adulto vinculado ACTIVA.
  // Cada creación o cambio de estado (caída/SOS desde la app, cierre
  // automático de zona segura, etc.) invalida ['alertas'] y la tabla
  // relea GET /alertas sin recargar la página.
  const idsAdultos = useMemo(
    () =>
      (misAdultos.data ?? [])
        .filter((adulto) => adulto.estado === 'ACTIVA')
        .map((adulto) => adulto.id),
    [misAdultos.data],
  )
  const stream = useAlertasStream(idsAdultos)

  const nombreAdulto = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const a of adultos.data ?? []) {
      mapa.set(a.id, `${a.nombre} ${a.apellido}`)
    }
    return mapa
  }, [adultos.data])

  const visibles = useMemo(
    () =>
      verHistorial
        ? (alertas.data ?? [])
        : (alertas.data ?? []).filter((a) => a.estado !== 'RESUELTA'),
    [alertas.data, verHistorial],
  )

  function transicionar(alerta: Alerta, cuerpo: TransicionAlerta) {
    actualizar.mutate({ id: alerta.id, cuerpo })
  }

  /** Baja lógica: la alerta pasa a CANCELADA y desaparece del historial. */
  function quitar(alerta: Alerta) {
    const confirmado = window.confirm(
      `¿Eliminar del historial la alerta "${alerta.titulo}"? La fila se conserva para auditoría.`,
    )
    if (!confirmado) return
    eliminar.mutate(alerta.id)
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-pino-900">
          <IconoAlertas size={24} className="text-pino-600" />
          Alertas
        </h1>

        {stream.estado === 'conectado' && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-pino-100 px-2.5 py-1 text-xs font-medium text-pino-800"
            title="Recibe en vivo nuevas alertas y cambios de estado"
          >
            <span className="size-2 rounded-full bg-pino-600" />
            En vivo
          </span>
        )}
        {stream.estado === 'error' && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800"
            title="Hubo un fallo de conexión; reintentando automáticamente"
          >
            <span className="size-2 rounded-full bg-amber-500" />
            Reconectando…
          </span>
        )}

        <label className="flex items-center gap-2 text-sm text-salvia-700">
          <input
            type="checkbox"
            className="size-4 rounded border-salvia-300 accent-pino-600"
            checked={verHistorial}
            onChange={(e) => setVerHistorial(e.target.checked)}
          />
          Mostrar también resueltas
        </label>
      </div>

      <p className="max-w-2xl text-sm/6 text-salvia-700">
        Las alertas críticas se agregan a la cola de WhatsApp para contactos y
        familiares con consentimiento, cuando la integración está configurada.
        La columna WhatsApp muestra los estados registrados del proveedor.
      </p>

      {/* Filtro por estado */}
      <div className={BARRA_FILTROS}>
        <div>
          <label
            htmlFor="filtro-alerta-estado-panel"
            className="text-xs font-medium text-salvia-600"
          >
            Estado
          </label>
          <select
            id="filtro-alerta-estado-panel"
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className={`${CONTROL_FILTRO} ${ANCHO_NORMAL}`}
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
        ) : visibles.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-pino-900">
              No hay alertas {verHistorial ? 'registradas' : 'pendientes'}
            </p>
            <p className="mt-1 text-sm text-salvia-600">
              {verHistorial
                ? 'Cuando el sistema detecte algo, aparecerá aquí.'
                : 'Todo en orden. Activa el historial para ver las resueltas.'}
            </p>
          </div>
        ) : (
          <TablaAlertas
            alertas={visibles}
            resumenWhatsapp={whatsapp.isError ? undefined : whatsapp.data}
            nombreAdulto={nombreAdulto}
            onTransicionar={transicionar}
            onEliminar={quitar}
            ocupados={[
              ...(actualizar.isPending && actualizar.variables
                ? [actualizar.variables.id]
                : []),
              ...(eliminar.isPending && eliminar.variables
                ? [eliminar.variables]
                : []),
            ]}
          />
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

const etiquetaTipo: Record<Alerta['tipo'], string> = {
  SOS: 'SOS',
  CAIDA: 'Caída',
  ZONA_SEGURA: 'Zona segura',
  MEDICAMENTO: 'Medicamento',
  INACTIVIDAD: 'Inactividad',
  SISTEMA: 'Sistema',
  OTRA: 'Otra',
}

type TablaAlertasProps = {
  alertas: Alerta[]
  resumenWhatsapp: ResumenWhatsapp[] | undefined
  nombreAdulto: Map<string, string>
  onTransicionar: (alerta: Alerta, cuerpo: TransicionAlerta) => void
  onEliminar: (alerta: Alerta) => void
  ocupados: string[]
}

function TablaAlertas({
  alertas,
  resumenWhatsapp,
  nombreAdulto,
  onTransicionar,
  onEliminar,
  ocupados,
}: TablaAlertasProps) {
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
          <Th>WhatsApp</Th>
          <Th>
            <span className="sr-only">Acciones</span>
          </Th>
        </tr>
      </thead>
      <tbody>
        {alertas.map((alerta) => {
          const ocupado = ocupados.includes(alerta.id)
          const cerrada =
            alerta.estado === 'RESUELTA' || alerta.estado === 'CANCELADA'

          return (
            <tr key={alerta.id} className="hover:bg-salvia-50">
              <Td className="whitespace-nowrap text-xs">
                {formatFechaHora(alerta.ocurrida_en)}
              </Td>
              <Td className="font-medium">
                {nombreAdulto.get(alerta.adulto_id) ?? alerta.adulto_id}
              </Td>
              <Td className="text-xs font-medium">
                {etiquetaTipo[alerta.tipo] ?? alerta.tipo}
              </Td>
              <Td className="max-w-64 truncate">{alerta.titulo}</Td>
              <Td>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${clasesSeveridad[alerta.severidad]}`}
                >
                  {alerta.severidad.toLowerCase()}
                </span>
              </Td>
              <Td>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${clasesEstado[alerta.estado]}`}
                >
                  {etiquetaEstado(alerta.estado)}
                </span>
              </Td>
              <Td>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${'bg-salvia-100 text-salvia-700'}`}
                >
                  {resumirWhatsapp(resumenWhatsapp, alerta.id)}
                </span>
              </Td>
              <Td>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {!cerrada && alerta.estado === 'ABIERTA' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={ocupado}
                      onClick={() =>
                        onTransicionar(alerta, {
                          estado: 'EN_ATENCION',
                          detalle: 'Atendida por el familiar desde el panel.',
                        })
                      }
                    >
                      Atender
                    </Button>
                  )}
                  {!cerrada && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={ocupado}
                      onClick={() =>
                        onTransicionar(alerta, {
                          estado: 'RESUELTA',
                          detalle: 'Resuelta por el familiar desde el panel.',
                        })
                      }
                    >
                      Resolver
                    </Button>
                  )}
                  {!cerrada && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={ocupado}
                      onClick={() =>
                        onTransicionar(alerta, {
                          estado: 'CANCELADA',
                          detalle: 'Cancelada por el familiar (falsa alarma).',
                        })
                      }
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={ocupado}
                    onClick={() => onEliminar(alerta)}
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
  )
}

function etiquetaEstado(estado: Alerta['estado']): string {
  switch (estado) {
    case 'ABIERTA':
      return 'Abierta'
    case 'EN_ATENCION':
      return 'En atención'
    case 'RESUELTA':
      return 'Resuelta'
    case 'CANCELADA':
      return 'Cancelada'
  }
}
