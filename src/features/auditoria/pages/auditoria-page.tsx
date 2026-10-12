import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Td, Table, Th } from '@/components/ui/table'
import { IconoAuditoria } from '@/lib/iconos'
import { formatFechaHora } from '@/lib/format'

import { useAuditoria } from '../hooks'
import type { EventoAuditoria } from '../types'


const LIMITE = 200

function mensajeDeError(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'status' in error.response
  ) {
    const status = error.response.status
    if (status === 403) {
      return 'No tienes permisos para consultar la auditoría.'
    }
  }

  return 'No se pudo cargar la bitácora. Verifica tu conexión e intenta de nuevo.'
}

function EtiquetaEntidad({ entidad }: { entidad: string }) {
  return (
    <code className="rounded bg-salvia-100 px-1.5 py-0.5 text-xs text-pino-900">
      {entidad}
    </code>
  )
}

function EtiquetaAccion({ accion }: { accion: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-pino-50 px-2 py-0.5 text-xs font-medium text-pino-800">
      {accion}
    </span>
  )
}

function DetalleJson({ datos }: { datos: Record<string, unknown> | null }) {
  if (!datos || Object.keys(datos).length === 0) return <span>—</span>

  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-xs font-medium text-pino-700 underline-offset-2 hover:underline">
        Ver datos
      </summary>
      <pre className="mt-2 max-w-xs overflow-x-auto rounded-md bg-salvia-50 p-2 text-xs leading-5 text-salvia-800">
        {JSON.stringify(datos, null, 2)}
      </pre>
    </details>
  )
}

export function AuditoriaPage() {
  const [entidad, setEntidad] = useState('')
  const [accion, setAccion] = useState('')
  const [actorEmail, setActorEmail] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const filtros = {
    ...(entidad ? { entidad } : {}),
    ...(accion ? { accion } : {}),
    ...(actorEmail.includes('-')
      ? { actorId: actorEmail.trim() }
      : {}),
    ...(desde ? { desde: new Date(desde).toISOString() } : {}),
    ...(hasta
      ? { hasta: new Date(`${hasta}T23:59:59`).toISOString() }
      : {}),
    limite: LIMITE,
  }

  const auditoria = useAuditoria(filtros)

  /** Uniones de valores existentes para poblar los selects. */
  const entidades = new Set<string>()
  const acciones = new Set<string>()
  for (const evento of auditoria.data ?? []) {
    entidades.add(evento.entidad)
    acciones.add(evento.accion)
  }

  function limpiar() {
    setEntidad('')
    setAccion('')
    setActorEmail('')
    setDesde('')
    setHasta('')
  }

  const filtrosActivos = Boolean(
    entidad || accion || actorEmail || desde || hasta,
  )

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-pino-900">
          <IconoAuditoria size={24} className="text-pino-600" />
          Auditoría
        </h1>
      </div>

      <p className="max-w-2xl text-sm/6 text-salvia-700">
        Registro de acciones del sistema: quién hizo qué, cuándo y desde
        dónde. La bitácora la escribe el backend en cada operación; aquí
        solo se consulta y se filtra.
      </p>

      {/* Filtros (query params reales del backend) */}
      <div className="rounded-lg border border-salvia-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="filtro-entidad"
              className="text-xs font-medium text-salvia-600"
            >
              Entidad
            </label>
            <select
              id="filtro-entidad"
              value={entidad}
              onChange={(e) => setEntidad(e.target.value)}
              className="mt-1 w-full rounded-md border border-salvia-300 bg-white px-3 py-2 text-sm text-pino-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600"
            >
              <option value="">Todas</option>
              {[...entidades].map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filtro-accion"
              className="text-xs font-medium text-salvia-600"
            >
              Acción
            </label>
            <select
              id="filtro-accion"
              value={accion}
              onChange={(e) => setAccion(e.target.value)}
              className="mt-1 w-full rounded-md border border-salvia-300 bg-white px-3 py-2 text-sm text-pino-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600"
            >
              <option value="">Todas</option>
              {[...acciones].map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filtro-actor"
              className="text-xs font-medium text-salvia-600"
            >
              Actor (UUID)
            </label>
            <input
              id="filtro-actor"
              type="text"
              placeholder="ID del usuario…"
              value={actorEmail}
              onChange={(e) => setActorEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-salvia-300 bg-white px-3 py-2 text-sm text-pino-950 placeholder:text-salvia-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="filtro-desde"
                className="text-xs font-medium text-salvia-600"
              >
                Desde
              </label>
              <input
                id="filtro-desde"
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="mt-1 w-full rounded-md border border-salvia-300 bg-white px-3 py-2 text-sm text-pino-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600"
              />
            </div>
            <div>
              <label
                htmlFor="filtro-hasta"
                className="text-xs font-medium text-salvia-600"
              >
                Hasta
              </label>
              <input
                id="filtro-hasta"
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="mt-1 w-full rounded-md border border-salvia-300 bg-white px-3 py-2 text-sm text-pino-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600"
              />
            </div>
          </div>
        </div>

        {filtrosActivos && (
          <div className="mt-3 flex justify-end">
            <Button variant="secondary" size="sm" onClick={limpiar}>
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-salvia-200 bg-white shadow-sm">
        {auditoria.isPending ? (
          <div className="flex items-center justify-center gap-3 p-10 text-sm text-salvia-600">
            <Spinner size="sm" label="Cargando bitácora" />
            Cargando bitácora…
          </div>
        ) : auditoria.isError ? (
          <div className="space-y-3 p-6">
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            >
              {mensajeDeError(auditoria.error)}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void auditoria.refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : auditoria.data.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-pino-900">
              {filtrosActivos
                ? 'No hay eventos que coincidan con los filtros'
                : 'La bitácora está vacía'}
            </p>
            <p className="mt-1 text-sm text-salvia-600">
              {filtrosActivos
                ? 'Ajusta o limpia los filtros e intenta de nuevo.'
                : 'Las acciones de los usuarios aparecerán aquí al ejecutarse.'}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Fecha</Th>
                  <Th>Actor</Th>
                  <Th>Acción</Th>
                  <Th>Entidad</Th>
                  <Th>Registro</Th>
                  <Th>Origen</Th>
                  <Th>
                    <span className="sr-only">Datos</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {auditoria.data.map((evento: EventoAuditoria) => (
                  <tr key={evento.id} className="hover:bg-salvia-50">
                    <Td className="whitespace-nowrap text-xs">
                      {formatFechaHora(evento.created_at)}
                    </Td>
                    <Td className="max-w-56">
                      {evento.actor ? (
                        <>
                          <span className="block truncate text-xs font-medium text-pino-900">
                            {evento.actor.nombre} {evento.actor.apellido}
                          </span>
                          <span className="block truncate text-xs text-salvia-600">
                            {evento.actor.email}
                          </span>
                        </>
                      ) : (
                        <span className="font-mono text-xs text-salvia-600">
                          {evento.actor_id ?? 'sistema'}
                        </span>
                      )}
                    </Td>
                    <Td>
                      <EtiquetaAccion accion={evento.accion} />
                    </Td>
                    <Td>
                      <EtiquetaEntidad entidad={evento.entidad} />
                    </Td>
                    <Td className="max-w-32 truncate font-mono text-xs">
                      {evento.entidad_id ?? '—'}
                    </Td>
                    <Td className="max-w-48 truncate text-xs">
                      {evento.ip ?? '—'}
                    </Td>
                    <Td>
                      <DetalleJson datos={evento.datos_despues} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {auditoria.data.length >= LIMITE && (
              <p className="border-t border-salvia-100 px-4 py-3 text-xs text-salvia-600">
                Mostrando los {LIMITE} eventos más recientes. Usa los filtros
                para acotar la búsqueda.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  )
}
