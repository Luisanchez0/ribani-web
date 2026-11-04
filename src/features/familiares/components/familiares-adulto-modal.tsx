import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { formatFecha } from '@/lib/format'
import { useFamiliaresDeAdulto } from '../hooks'
import type { AdultoVinculado } from '../types'

function Etiqueta({ children, tono = 'pino' }: { children: string; tono?: 'pino' | 'amber' | 'salvia' }) {
  const tonos = {
    pino: 'bg-pino-50 text-pino-800',
    amber: 'bg-amber-100 text-amber-800',
    salvia: 'bg-salvia-100 text-salvia-700',
  } as const

  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${tonos[tono]}`}>
      {children}
    </span>
  )
}

/**
 * Lista de familiares que acompañan a `adulto` (vínculos ACTIVA y PENDIENTE)
 * con acceso directo a invitar a otro. Solo lectura: cada familiar gestiona
 * su propio vínculo.
 */
export function FamiliaresAdultoModal({
  adulto,
  onInvitar,
  onCerrar,
}: {
  adulto: AdultoVinculado
  onInvitar: () => void
  onCerrar: () => void
}) {
  const familiares = useFamiliaresDeAdulto(adulto.id)
  const nombreAdulto = `${adulto.nombre} ${adulto.apellido}`.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar lista de familiares"
        className="absolute inset-0 cursor-default bg-pino-950/60"
        onClick={onCerrar}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-familiares-adulto"
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg border border-salvia-200 bg-white p-6 shadow-lg"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="titulo-familiares-adulto"
              className="font-display text-lg font-semibold text-pino-900"
            >
              Familiares de {nombreAdulto}
            </h2>
            <p className="mt-1 text-sm/6 text-salvia-700">
              Personas que acompañan su cuidado y reciben sus alertas.
            </p>
          </div>
          <Button size="sm" onClick={onInvitar}>
            Invitar familiar
          </Button>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          {familiares.isPending ? (
            <div className="flex items-center justify-center gap-3 p-6 text-sm text-salvia-600">
              <Spinner size="sm" label="Cargando familiares" />
              Cargando familiares…
            </div>
          ) : familiares.isError ? (
            <div className="space-y-3">
              <Alert variant="error">
                No se pudo cargar la lista de familiares. Intenta de nuevo.
              </Alert>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void familiares.refetch()}
              >
                Reintentar
              </Button>
            </div>
          ) : familiares.data.length <= 1 ? (
            <div className="p-6 text-center">
              <p className="text-sm font-medium text-pino-900">
                Por ahora solo tú acompañas a {adulto.nombre}
              </p>
              <p className="mt-1 text-sm text-salvia-600">
                Invita a otro familiar para compartir su cuidado.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {familiares.data.map((familiar) => (
                <li
                  key={familiar.vinculo_id}
                  className="rounded-md border border-salvia-200 px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-sm font-medium text-pino-900">
                      {familiar.nombre} {familiar.apellido}
                    </p>
                    {familiar.es_tu_vinculo && <Etiqueta tono="salvia">Tú</Etiqueta>}
                    {familiar.es_contacto_principal && (
                      <Etiqueta tono="amber">Principal</Etiqueta>
                    )}
                  </div>
                  <p className="mt-0.5 break-words text-xs text-salvia-600">
                    {familiar.email}
                    {familiar.parentesco ? ` · ${familiar.parentesco}` : ''}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {familiar.estado === 'PENDIENTE' ? (
                      <Etiqueta tono="amber">
                        {`Pendiente: falta que ${adulto.nombre} acepte`}
                      </Etiqueta>
                    ) : (
                      <Etiqueta>{`Desde ${formatFecha(familiar.created_at)}`}</Etiqueta>
                    )}
                    {familiar.puede_ver_ubicacion && <Etiqueta>Ubicación</Etiqueta>}
                    {familiar.puede_gestionar_medicamentos && (
                      <Etiqueta>Medicamentos</Etiqueta>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={onCerrar}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}
