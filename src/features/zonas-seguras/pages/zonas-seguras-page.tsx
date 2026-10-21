import { useMemo, useState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Table, Td, Th } from '@/components/ui/table'
import { useMisAdultos } from '@/features/familiares'
import { IconoZonasSeguras } from '@/lib/iconos'

import { ZonaFormularioModal } from '../components/zona-formulario-modal'
import {
  useActualizarZonaSegura,
  useEliminarZonaSegura,
  useZonasSeguras,
} from '../hooks/use-zonas-seguras'
import type { ZonaSegura } from '../types'

function BadgeActiva({ activa }: { activa: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
        activa ? 'bg-pino-100 text-pino-800' : 'bg-salvia-100 text-salvia-600'
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${
          activa ? 'bg-pino-600' : 'bg-salvia-400'
        }`}
      />
      {activa ? 'Activa' : 'Inactiva'}
    </span>
  )
}

/**
 * Zonas seguras (/panel/zonas-seguras).
 * Contrato: GET/POST /zonas-seguras, PATCH /zonas-seguras/{id} (incluye
 * `activa: true` para reactivar) y DELETE /zonas-seguras/{id} (baja lógica).
 */
export function ZonasSegurasPage() {
  const adultos = useMisAdultos()
  const [adultoFiltro, setAdultoFiltro] = useState('')
  const zonas = useZonasSeguras(adultoFiltro || undefined, false)
  const actualizar = useActualizarZonaSegura()
  const desactivar = useEliminarZonaSegura()

  const [modalAbierto, setModalAbierto] = useState(false)
  const [zonaEditar, setZonaEditar] = useState<ZonaSegura | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  const nombresAdultos = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const adulto of adultos.data ?? []) {
      mapa.set(adulto.id, `${adulto.nombre} ${adulto.apellido}`)
    }
    return mapa
  }, [adultos.data])

  function desactivarZona(zona: ZonaSegura) {
    const confirmado = window.confirm(
      `¿Desactivar la zona "${zona.nombre}"? Dejará de generar avisos. Podrás reactivarla después.`,
    )
    if (!confirmado) return

    setErrorAccion(null)
    desactivar.mutate(zona.id, {
      onError: () =>
        setErrorAccion(`No se pudo desactivar la zona "${zona.nombre}".`),
    })
  }

  function reactivarZona(zona: ZonaSegura) {
    setErrorAccion(null)
    actualizar.mutate(
      { id: zona.id, datos: { activa: true } },
      {
        onError: () =>
          setErrorAccion(`No se pudo reactivar la zona "${zona.nombre}".`),
      },
    )
  }

  const ocupadoId =
    (desactivar.isPending ? desactivar.variables : undefined) ??
    (actualizar.isPending ? actualizar.variables?.id : undefined)

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-pino-900">
          <IconoZonasSeguras size={24} className="text-pino-600" />
          Zonas seguras
        </h1>

        <Button
          onClick={() => {
            setZonaEditar(null)
            setModalAbierto(true)
          }}
        >
          Nueva zona
        </Button>
      </div>

      <p className="max-w-2xl text-sm/6 text-salvia-700">
        Define áreas alrededor de un punto. Recibirás avisos cuando el adulto
        mayor salga o entre a cada zona.
      </p>

      {(adultos.data?.length ?? 0) > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor="filtro-adulto-zonas"
            className="text-sm font-medium text-pino-900"
          >
            Adulto:
          </label>
          <select
            id="filtro-adulto-zonas"
            value={adultoFiltro}
            onChange={(evento) => setAdultoFiltro(evento.target.value)}
            className="rounded-md border border-salvia-300 bg-white px-3 py-2 text-sm text-pino-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600"
          >
            <option value="">Todos</option>
            {(adultos.data ?? []).map((adulto) => (
              <option key={adulto.id} value={adulto.id}>
                {adulto.nombre} {adulto.apellido}
              </option>
            ))}
          </select>
        </div>
      )}

      {errorAccion && <Alert variant="error">{errorAccion}</Alert>}

      <div className="rounded-lg border border-salvia-200 bg-white shadow-sm">
        {zonas.isPending ? (
          <div className="flex items-center justify-center gap-3 p-10 text-sm text-salvia-600">
            <Spinner size="sm" label="Cargando zonas seguras" />
            Cargando zonas seguras…
          </div>
        ) : zonas.isError ? (
          <div className="space-y-3 p-6">
            <Alert variant="error">
              No se pudieron cargar las zonas seguras. Verifica tu conexión e
              intenta de nuevo.
            </Alert>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void zonas.refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : zonas.data.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-pino-900">
              No hay zonas seguras
            </p>
            <p className="mt-1 text-sm text-salvia-600">
              Crea una zona para recibir avisos de salida o entrada.
            </p>
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Zona</Th>
                <Th>Adulto</Th>
                <Th>Centro</Th>
                <Th>Radio</Th>
                <Th>Avisos</Th>
                <Th>Estado</Th>
                <Th>
                  <span className="sr-only">Acciones</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {zonas.data.map((zona) => {
                const ocupada = ocupadoId === zona.id
                return (
                  <tr key={zona.id} className="hover:bg-salvia-50">
                    <Td className="font-medium">{zona.nombre}</Td>
                    <Td>{nombresAdultos.get(zona.adulto_id) ?? '—'}</Td>
                    <Td>
                      {zona.latitud_centro.toFixed(5)},{' '}
                      {zona.longitud_centro.toFixed(5)}
                    </Td>
                    <Td>{zona.radio_metros} m</Td>
                    <Td>
                      {[
                        zona.notificar_salida && 'Salida',
                        zona.notificar_entrada && 'Entrada',
                      ]
                        .filter(Boolean)
                        .join(' y ') || 'Ninguno'}
                    </Td>
                    <Td>
                      <BadgeActiva activa={zona.activa} />
                    </Td>
                    <Td>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={ocupada}
                          onClick={() => {
                            setErrorAccion(null)
                            setZonaEditar(zona)
                            setModalAbierto(true)
                          }}
                        >
                          Editar
                        </Button>
                        {zona.activa ? (
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={ocupada}
                            onClick={() => desactivarZona(zona)}
                          >
                            Desactivar
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={ocupada}
                            onClick={() => reactivarZona(zona)}
                          >
                            Reactivar
                          </Button>
                        )}
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </div>

      {/* key distinta por modo/zona: remonta y reinicia el formulario. */}
      <ZonaFormularioModal
        key={zonaEditar?.id ?? 'nueva'}
        abierto={modalAbierto}
        zonaEditar={zonaEditar}
        onCerrar={() => {
          setModalAbierto(false)
          setZonaEditar(null)
        }}
      />
    </section>
  )
}
