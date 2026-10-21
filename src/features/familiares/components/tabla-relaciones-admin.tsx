import { Button } from '@/components/ui/button'
import { Table, Td, Th } from '@/components/ui/table'

import type { VinculoAdmin } from '../types'

type EstadoBadgeProps = {
  estado: 'ACTIVA' | 'PENDIENTE' | 'REVOCADA'
}
export function BadgeEstadoVinculo({ estado }: EstadoBadgeProps) {
  const variantes = {
    ACTIVA: 'bg-pino-100 text-pino-800',
    PENDIENTE: 'bg-amber-100 text-amber-800',
    REVOCADA: 'bg-red-100 text-red-800',
  } as const

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variantes[estado]}`}
    >
      {estado.toLowerCase()}
    </span>
  )
}


export function TablaRelacionesAdmin({
  vinculos,
  ocupados,
  onRevocar,
  onEliminar,
  onDosPasos,
}: {
  vinculos: VinculoAdmin[]
  ocupados: Set<string>
  onRevocar: (id: string) => void
  onEliminar: (id: string) => void
  /** Abre el modal de 2FA asistido para el adulto del vínculo. */
  onDosPasos?: (vinculo: VinculoAdmin) => void
}) {
  return (
    <div className="rounded-lg border border-salvia-200 bg-white shadow-sm">
      <div className="border-b border-salvia-100 px-4 py-3">
        <h2 className="font-display text-base font-semibold text-pino-900">
          Relaciones familiar–adulto mayor
        </h2>
        <p className="mt-0.5 text-xs text-salvia-600">
          Todas las relaciones FAMILIAR_ENCARGADO ↔ ADULTO_MAYOR del sistema.
        </p>
      </div>

      {vinculos.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-sm font-medium text-pino-900">
            No hay relaciones registradas
          </p>
          <p className="mt-1 text-sm text-salvia-600">
            Usa «Invitar cuidador» o «Vincular familiar» para crear la primera
            relación entre un familiar encargado y un adulto mayor.
          </p>
        </div>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Familiar encargado</Th>
              <Th>Adulto mayor</Th>
              <Th>Parentesco</Th>
              <Th>Permisos</Th>
              <Th>Estado</Th>
              <Th>
                <span className="sr-only">Acciones</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {vinculos.map((vinculo) => {
              const ocupado = ocupados.has(vinculo.id)

              return (
                <tr key={vinculo.id} className="hover:bg-salvia-50">
                  <Td className="font-medium">
                    {vinculo.familiar.nombre} {vinculo.familiar.apellido}
                    <span className="block text-xs text-salvia-600">
                      {vinculo.familiar.email}
                    </span>
                  </Td>
                  <Td className="font-medium">
                    {vinculo.adulto.nombre} {vinculo.adulto.apellido}
                    <span className="block text-xs text-salvia-600">
                      {vinculo.adulto.email}
                    </span>
                  </Td>
                  <Td>{vinculo.parentesco ?? '—'}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {vinculo.puede_ver_ubicacion && (
                        <span className="rounded bg-pino-50 px-1.5 py-0.5 text-xs text-pino-800">
                          Ubicación
                        </span>
                      )}
                      {vinculo.puede_gestionar_medicamentos && (
                        <span className="rounded bg-pino-50 px-1.5 py-0.5 text-xs text-pino-800">
                          Medicamentos
                        </span>
                      )}
                      {!vinculo.puede_ver_ubicacion &&
                        !vinculo.puede_gestionar_medicamentos && <span>—</span>}
                    </div>
                  </Td>
                  <Td>
                    <BadgeEstadoVinculo estado={vinculo.estado} />
                  </Td>
                  <Td>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {onDosPasos && vinculo.estado === 'ACTIVA' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={ocupado}
                          onClick={() => onDosPasos(vinculo)}
                        >
                          2FA
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={ocupado || vinculo.estado !== 'ACTIVA'}
                        onClick={() => onRevocar(vinculo.id)}
                      >
                        Revocar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={ocupado}
                        onClick={() => onEliminar(vinculo.id)}
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
      )}
    </div>
  )
}
