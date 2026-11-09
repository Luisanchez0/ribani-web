import { useMemo, useState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { useAdultos } from '@/features/usuarios'
import { IconoMedicamentos } from '@/lib/iconos'

import type { InfoAdulto } from '../components/adulto-etiqueta'
import { GrupoMedicamentosAdmin } from '../components/grupo-medicamentos-admin'
import { useMedicamentos } from '../hooks'
import type { Medicamento } from '../types'
import { filtrarMedicamentos, type EstadoFiltroMedicamentos } from '../utils/filtrar-medicamentos'

const LIMITE_MEDICAMENTOS = 500

/** Supervisión administrativa de medicamentos; conserva la vista de consulta. */
export function MedicamentosAdminPage() {
  const [adultoSel, setAdultoSel] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState<EstadoFiltroMedicamentos>('todos')
  const medicamentos = useMedicamentos({
    soloActivos: false,
    limite: LIMITE_MEDICAMENTOS,
    ...(adultoSel ? { adultoId: adultoSel } : {}),
  })
  const adultos = useAdultos()

  const nombresAdultos = useMemo(() => new Map(
    (adultos.data ?? []).map(adulto => [adulto.id, `${adulto.nombre} ${adulto.apellido}`]),
  ), [adultos.data])

  const etiquetasAdultos = useMemo(() => new Map<string, InfoAdulto>(
    [...nombresAdultos].map(([id, nombre], indice) => [id, { nombre, indice }]),
  ), [nombresAdultos])

  const filtrados = useMemo(
    () => filtrarMedicamentos(medicamentos.data ?? [], busqueda, estado, nombresAdultos),
    [medicamentos.data, busqueda, estado, nombresAdultos],
  )

  const porAdulto = useMemo(() => {
    const grupos = new Map<string, Medicamento[]>()
    for (const medicamento of filtrados) {
      const grupo = grupos.get(medicamento.adulto_id) ?? []
      grupo.push(medicamento)
      grupos.set(medicamento.adulto_id, grupo)
    }
    return [...grupos]
  }, [filtrados])

  const activos = filtrados.filter(medicamento => medicamento.activo).length
  const hayFiltros = busqueda.trim() !== '' || adultoSel !== '' || estado !== 'todos'
  const limiteAlcanzado = (medicamentos.data?.length ?? 0) >= LIMITE_MEDICAMENTOS
  const resumen = [
    { etiqueta: 'Medicamentos', valor: filtrados.length, detalle: 'En los resultados' },
    { etiqueta: 'Activos', valor: activos, detalle: 'Registros habilitados' },
    { etiqueta: 'Inactivos', valor: filtrados.length - activos, detalle: 'Registros desactivados' },
    { etiqueta: 'Adultos con registro', valor: porAdulto.length, detalle: 'En los resultados' },
  ]

  function limpiarFiltros() {
    setAdultoSel('')
    setBusqueda('')
    setEstado('todos')
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 basis-72 items-start gap-3 sm:gap-4">
          <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-xl border border-pino-200 bg-pino-100 text-pino-700">
            <IconoMedicamentos size={25} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-salvia-600">Administración</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-pino-900 sm:text-3xl">Medicamentos</h1>
            <p className="mt-2 max-w-2xl text-sm/6 text-salvia-700">
              Consulta las dosis, indicaciones y periodos registrados para cada adulto mayor.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-salvia-200 bg-white px-3 py-1 text-xs font-medium text-salvia-700">Vista de consulta</span>
          <Button
            variant="secondary"
            disabled={medicamentos.isFetching || adultos.isFetching}
            onClick={() => void Promise.all([medicamentos.refetch(), adultos.refetch()])}
          >
            {medicamentos.isFetching || adultos.isFetching ? 'Actualizando…' : 'Actualizar'}
          </Button>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {resumen.map((item, indice) => (
          <div key={item.etiqueta} className={`rounded-xl border p-4 sm:p-5 ${
            indice === 1 ? 'border-pino-200 bg-pino-50' : 'border-salvia-200 bg-white'
          }`}>
            <dt className="text-sm font-medium text-salvia-700">{item.etiqueta}</dt>
            <dd className="mt-2">
              <span className="font-display text-3xl font-semibold tabular-nums text-pino-900">
                {medicamentos.isSuccess ? item.valor : '—'}
              </span>
              <span className="mt-1 block text-xs text-salvia-600">{item.detalle}</span>
            </dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="titulo-filtros-medicamentos" className="rounded-xl border border-salvia-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 id="titulo-filtros-medicamentos" className="text-sm font-semibold text-pino-900">Buscar y filtrar</h2>
          {hayFiltros && <Button variant="secondary" size="sm" onClick={limpiarFiltros}>Limpiar filtros</Button>}
        </div>
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <label htmlFor="filtro-med-buscar" className="block text-sm font-medium text-salvia-700">Buscar</label>
            <Input
              id="filtro-med-buscar"
              type="search"
              placeholder="Medicamento, indicaciones o adulto…"
              className="mt-1.5"
              value={busqueda}
              onChange={evento => setBusqueda(evento.target.value)}
              aria-controls="resultados-medicamentos"
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="filtro-med-adulto" className="block text-sm font-medium text-salvia-700">Adulto mayor</label>
            <Select
              id="filtro-med-adulto"
              value={adultoSel}
              onChange={evento => setAdultoSel(evento.target.value)}
              className="mt-1.5"
              disabled={adultos.isPending || adultos.isError}
              aria-controls="resultados-medicamentos"
            >
              <option value="">{adultos.isPending ? 'Cargando adultos…' : 'Todos los adultos'}</option>
              {(adultos.data ?? []).map(adulto => (
                <option key={adulto.id} value={adulto.id}>{adulto.nombre} {adulto.apellido}</option>
              ))}
            </Select>
          </div>
          <div className="min-w-0">
            <label htmlFor="filtro-med-estado" className="block text-sm font-medium text-salvia-700">Estado</label>
            <Select
              id="filtro-med-estado"
              value={estado}
              onChange={evento => {
                const valor = evento.target.value
                if (valor === 'todos' || valor === 'activos' || valor === 'inactivos') setEstado(valor)
              }}
              className="mt-1.5"
              aria-controls="resultados-medicamentos"
            >
              <option value="todos">Todos los estados</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
            </Select>
          </div>
        </div>
      </section>

      {adultos.isError && (
        <Alert variant="error" className="flex flex-wrap items-center justify-between gap-3">
          <span>No se pudieron cargar los nombres de los adultos. Puedes consultar los medicamentos y reintentar.</span>
          <Button variant="secondary" size="sm" onClick={() => void adultos.refetch()}>Reintentar adultos</Button>
        </Alert>
      )}

      <section id="resultados-medicamentos" aria-labelledby="titulo-resultados-medicamentos" aria-busy={medicamentos.isFetching} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="titulo-resultados-medicamentos" className="font-display text-lg font-semibold text-pino-900">Medicamentos por adulto</h2>
          <p role="status" className="text-sm text-salvia-700">
            {medicamentos.isSuccess && `${filtrados.length} resultado${filtrados.length === 1 ? '' : 's'} · ${porAdulto.length} adulto${porAdulto.length === 1 ? '' : 's'}`}
          </p>
        </div>
        {limiteAlcanzado && (
          <Alert>Se muestran hasta {LIMITE_MEDICAMENTOS} registros. Los indicadores y la búsqueda corresponden a esa selección; elige un adulto para acotar la consulta.</Alert>
        )}
        {medicamentos.isPending ? (
          <div role="status" className="flex min-h-48 items-center justify-center gap-3 rounded-xl border border-salvia-200 bg-white p-6 text-sm text-salvia-700">
            <Spinner size="sm" label="Cargando medicamentos" />Cargando medicamentos…
          </div>
        ) : medicamentos.isError ? (
          <div className="space-y-4 rounded-xl border border-salvia-200 bg-white p-6">
            <Alert variant="error">No se pudieron cargar los medicamentos. Verifica tu conexión e intenta de nuevo.</Alert>
            <Button variant="secondary" onClick={() => void medicamentos.refetch()}>Reintentar</Button>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="rounded-xl border border-dashed border-salvia-300 bg-white px-5 py-12 text-center">
            <span aria-hidden="true" className="mx-auto grid size-12 place-items-center rounded-full bg-salvia-100 text-salvia-600"><IconoMedicamentos size={24} /></span>
            <h3 className="mt-4 font-semibold text-pino-900">{hayFiltros ? 'No encontramos medicamentos con estos filtros' : 'Aún no hay medicamentos registrados'}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm/6 text-salvia-700">
              {hayFiltros ? 'Prueba otro nombre, cambia el estado o consulta todos los adultos.' : 'Los registros aparecerán aquí cuando se agreguen medicamentos desde el panel familiar.'}
            </p>
            {hayFiltros && <Button variant="secondary" className="mt-5" onClick={limpiarFiltros}>Limpiar filtros</Button>}
          </div>
        ) : porAdulto.map(([adultoId, lista]) => (
          <GrupoMedicamentosAdmin key={adultoId} adultoId={adultoId} adulto={etiquetasAdultos.get(adultoId)} medicamentos={lista} />
        ))}
      </section>
      <p className="text-xs/6 text-salvia-600">Esta vista permite supervisar los registros. El alta y la edición se realizan desde el panel familiar.</p>
    </section>
  )
}
