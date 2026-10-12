import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { IconoFamiliares } from '@/lib/iconos'

import { TablaRelacionesAdmin } from '../components/tabla-relaciones-admin'
import {
  useActualizarVinculo,
  useDesvincularFamiliar,
  useVinculos,
} from '../hooks'
import type { VinculoAdmin } from '../types'


export function RelacionesAdminPage() {
  const vinculos = useVinculos()
  const actualizarVinculo = useActualizarVinculo()
  const desvincular = useDesvincularFamiliar()

  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')

 
  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return (vinculos.data ?? []).filter((v: VinculoAdmin) => {
      if (
        estadoFiltro &&
        v.estado !== (estadoFiltro as VinculoAdmin['estado'])
      )
        return false
      if (
        texto &&
        !`${v.familiar.nombre} ${v.familiar.apellido} ${v.familiar.email} ${v.adulto.nombre} ${v.adulto.apellido} ${v.adulto.email}`
          .toLowerCase()
          .includes(texto)
      )
        return false
      return true
    })
  }, [vinculos.data, busqueda, estadoFiltro])

  function revocar(id: string) {
    const confirmado = window.confirm(
      '¿Revocar el acceso de este familiar? Dejará de ver la información del adulto.',
    )
    if (!confirmado) return

    setErrorAccion(null)
    actualizarVinculo.mutate(
      { id, datos: { estado: 'REVOCADA' } },
      {
        onError: () =>
          setErrorAccion('No se pudo revocar el acceso. Intenta de nuevo.'),
      },
    )
  }

  function eliminar(id: string) {
    const confirmado = window.confirm(
      '¿Eliminar definitivamente el vínculo? Esta acción no se puede deshacer.',
    )
    if (!confirmado) return

    setErrorAccion(null)
    desvincular.mutate(id, {
      onError: () =>
        setErrorAccion('No se pudo eliminar el vínculo. Intenta de nuevo.'),
    })
  }

  const ocupados = new Set<string>([
    ...(actualizarVinculo.isPending && actualizarVinculo.variables
      ? [actualizarVinculo.variables.id]
      : []),
    ...(desvincular.isPending && desvincular.variables
      ? [desvincular.variables]
      : []),
  ])

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-pino-900">
          <IconoFamiliares size={24} className="text-pino-600" />
          Relaciones familiares
        </h1>
      </div>

      <p className="max-w-2xl text-sm/6 text-salvia-700">
        Quién cuida a quién: todas las relaciones entre familiares encargados
        y adultos mayores del sistema. Puedes revocar el acceso de un vínculo
        activo o eliminarlo por completo.
      </p>

      {/* Filtros: búsqueda y estado */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-salvia-200 bg-white p-4 shadow-sm">
        <div>
          <label
            htmlFor="filtro-rel-buscar"
            className="text-xs font-medium text-salvia-600"
          >
            Buscar
          </label>
          <input
            id="filtro-rel-buscar"
            type="search"
            placeholder="Nombre o correo del familiar o adulto…"
            className="mt-1 w-64 rounded-md border border-salvia-300 bg-white px-3 py-2 text-sm text-pino-950 placeholder:text-salvia-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
          />
        </div>

        <div>
          <label
            htmlFor="filtro-rel-estado"
            className="text-xs font-medium text-salvia-600"
          >
            Estado
          </label>
          <select
            id="filtro-rel-estado"
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="mt-1 rounded-md border border-salvia-300 bg-white px-3 py-2 text-sm text-pino-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600"
          >
            <option value="">Todos</option>
            <option value="ACTIVA">Activa</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="REVOCADA">Revocada</option>
          </select>
        </div>
      </div>

      {errorAccion && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          {errorAccion}
        </div>
      )}

      {vinculos.isPending ? (
        <div className="flex items-center justify-center gap-3 rounded-lg border border-salvia-200 bg-white p-10 text-sm text-salvia-600">
          <Spinner size="sm" label="Cargando relaciones" />
          Cargando relaciones…
        </div>
      ) : vinculos.isError ? (
        <div className="space-y-3 rounded-lg border border-salvia-200 bg-white p-6">
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          >
            No se pudieron cargar las relaciones. Verifica tu conexión e
            intenta de nuevo.
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void vinculos.refetch()}
          >
            Reintentar
          </Button>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-lg border border-salvia-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-medium text-pino-900">
            {(vinculos.data ?? []).length === 0
              ? 'No hay relaciones registradas'
              : 'Ninguna relación coincide con los filtros'}
          </p>
          <p className="mt-1 text-sm text-salvia-600">
            {(vinculos.data ?? []).length === 0
              ? 'Usa «Invitar cuidador» o «Vincular familiar» para crear la primera.'
              : 'Limpia la búsqueda o cambia el filtro de estado.'}
          </p>
        </div>
      ) : (
        <TablaRelacionesAdmin
          vinculos={filtrados}
          ocupados={ocupados}
          onRevocar={revocar}
          onEliminar={eliminar}
        />
      )}
    </section>
  )
}
