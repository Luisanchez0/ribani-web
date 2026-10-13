import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Td, Table, Th } from '@/components/ui/table'
import { IconoMedicamentos } from '@/lib/iconos'
import { formatFecha } from '@/lib/format'
import { useAdultos } from '@/features/usuarios'

import { useMedicamentos } from '../hooks'
import type { Medicamento } from '../types'

/**
 * Medicamentos (/admin/medicamentos, solo ADMINISTRADOR): vista de solo
 * lectura de TODOS los medicamentos del sistema, agrupados por adulto.
 * La edición sigue siendo tarea del familiar encargado desde su panel.
 */
export function MedicamentosAdminPage() {
  const medicamentos = useMedicamentos({ soloActivos: 'false' })
  const adultos = useAdultos()

  // Filtros: adulto (GET de backend), texto (cliente) y estado (cliente).
  const [adultoSel, setAdultoSel] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [soloActivos, setSoloActivos] = useState(false)

  const nombreAdulto = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const a of adultos.data ?? []) {
      mapa.set(a.id, `${a.nombre} ${a.apellido}`)
    }
    return mapa
  }, [adultos.data])

  /**
   * Filtrado cliente sobre la lista cargada (el backend solo soporta
   * adultoId/soloActivos): búsqueda por nombre/instrucciones y estado.
   */
  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return (medicamentos.data ?? []).filter((m) => {
      if (adultoSel && m.adulto_id !== adultoSel) return false
      if (soloActivos && !m.activo) return false
      if (texto && !`${m.nombre} ${m.instrucciones ?? ''}`.toLowerCase().includes(texto)) return false
      return true
    })
  }, [medicamentos.data, adultoSel, soloActivos, busqueda])

  /** Agrupa por adulto_id preservando el orden del backend. */
  const porAdulto = useMemo(() => {
    const grupos = new Map<string, Medicamento[]>()
    for (const medicamento of filtrados) {
      const lista = grupos.get(medicamento.adulto_id) ?? []
      lista.push(medicamento)
      grupos.set(medicamento.adulto_id, lista)
    }
    return grupos
  }, [filtrados])

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-pino-900">
          <IconoMedicamentos size={24} className="text-pino-600" />
          Medicamentos de los adultos
        </h1>
      </div>

      {/* Filtros: adulto, texto y estado */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-salvia-200 bg-white p-4 shadow-sm">
        <div>
          <label
            htmlFor="filtro-med-adulto"
            className="text-xs font-medium text-salvia-600"
          >
            Adulto
          </label>
          <select
            id="filtro-med-adulto"
            value={adultoSel}
            onChange={(e) => setAdultoSel(e.target.value)}
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
            htmlFor="filtro-med-buscar"
            className="text-xs font-medium text-salvia-600"
          >
            Buscar
          </label>
          <input
            id="filtro-med-buscar"
            type="search"
            placeholder="Nombre o instrucciones…"
            className="mt-1 w-56 rounded-md border border-salvia-300 bg-white px-3 py-2 text-sm text-pino-950 placeholder:text-salvia-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-salvia-700">
          <input
            type="checkbox"
            className="size-4 rounded border-salvia-300 accent-pino-600"
            checked={soloActivos}
            onChange={(e) => setSoloActivos(e.target.checked)}
          />
          Solo activos
        </label>
      </div>

      <p className="max-w-2xl text-sm/6 text-salvia-700">
        Todos los medicamentos registrados en el sistema, agrupados por adulto
        mayor. El alta y edición se realiza desde el panel del familiar.
      </p>

      <div className="rounded-lg border border-salvia-200 bg-white shadow-sm">
        {medicamentos.isPending ? (
          <div className="flex items-center justify-center gap-3 p-10 text-sm text-salvia-600">
            <Spinner size="sm" label="Cargando medicamentos" />
            Cargando medicamentos…
          </div>
        ) : medicamentos.isError ? (
          <div className="space-y-3 p-6">
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            >
              No se pudieron cargar los medicamentos. Verifica tu conexión e
              intenta de nuevo.
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void medicamentos.refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-pino-900">
              {(medicamentos.data ?? []).length === 0
                ? 'No hay medicamentos registrados'
                : 'Ningún medicamento coincide con los filtros'}
            </p>
            <p className="mt-1 text-sm text-salvia-600">
              {(medicamentos.data ?? []).length === 0
                ? 'Los medicamentos aparecen cuando el familiar de cada adulto los registra desde su panel.'
                : 'Limpia la búsqueda o cambia los filtros para ver más resultados.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-salvia-100">
            {[...porAdulto.entries()].map(([adultoId, lista]) => (
              <div key={adultoId}>
                <h2 className="bg-salvia-50 px-4 py-2 text-sm font-semibold text-pino-900">
                  {nombreAdulto.get(adultoId) ?? adultoId}{' '}
                  <span className="font-normal text-salvia-600">
                    ({lista.length} medicamento{lista.length === 1 ? '' : 's'})
                  </span>
                </h2>
                <Table>
                  <thead>
                    <tr>
                      <Th>Nombre</Th>
                      <Th>Dosis</Th>
                      <Th>Instrucciones</Th>
                      <Th>Inicio</Th>
                      <Th>Estado</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((medicamento) => (
                      <tr key={medicamento.id} className="hover:bg-salvia-50">
                        <Td className="font-medium">{medicamento.nombre}</Td>
                        <Td>
                          {medicamento.dosis} {medicamento.unidad_dosis}
                        </Td>
                        <Td className="max-w-64 truncate">
                          {medicamento.instrucciones ?? '—'}
                        </Td>
                        <Td>{formatFecha(medicamento.fecha_inicio)}</Td>
                        <Td>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              medicamento.activo
                                ? 'bg-pino-100 text-pino-800'
                                : 'bg-salvia-100 text-salvia-600'
                            }`}
                          >
                            {medicamento.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
