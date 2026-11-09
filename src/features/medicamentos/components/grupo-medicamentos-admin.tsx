import { useId } from 'react'

import { Td, Table, Th } from '@/components/ui/table'

import type { Medicamento } from '../types'
import { formatFechaMedicamento } from '../utils/format-fecha-medicamento'
import { AdultoEtiqueta, type InfoAdulto } from './adulto-etiqueta'

function EstadoMedicamento({ activo }: { activo: boolean }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
      activo ? 'bg-pino-100 text-pino-800' : 'bg-salvia-100 text-salvia-700'
    }`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${activo ? 'bg-pino-600' : 'bg-salvia-400'}`} />
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function PeriodoMedicamento({ medicamento }: { medicamento: Medicamento }) {
  return (
    <div className="space-y-1 text-sm">
      <p>
        <span className="text-salvia-600">Inicio: </span>
        <time dateTime={medicamento.fecha_inicio.slice(0, 10)}>{formatFechaMedicamento(medicamento.fecha_inicio)}</time>
      </p>
      <p className="text-salvia-600">
        {medicamento.fecha_fin ? <>Fin: <time dateTime={medicamento.fecha_fin.slice(0, 10)}>{formatFechaMedicamento(medicamento.fecha_fin)}</time></> : 'Sin fecha de fin'}
      </p>
    </div>
  )
}

export function GrupoMedicamentosAdmin({ adultoId, adulto, medicamentos }: {
  adultoId: string
  adulto: InfoAdulto | undefined
  medicamentos: Medicamento[]
}) {
  const tituloId = useId()
  const activos = medicamentos.filter(medicamento => medicamento.activo).length

  return (
    <section aria-labelledby={tituloId} className="overflow-hidden rounded-xl border border-salvia-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-salvia-200 bg-pino-50/60 px-4 py-4 sm:px-5">
        <div className="min-w-0 flex-1 basis-48">
          <p className="mb-1 text-xs font-medium text-salvia-600">Adulto mayor</p>
          <h3 id={tituloId} className="font-semibold text-pino-900">
            <AdultoEtiqueta adulto={adulto} multilinea />
          </h3>
          {!adulto && <p className="mt-1 break-all text-xs text-salvia-700">Referencia del adulto: {adultoId}</p>}
        </div>
        <p className="text-sm text-salvia-700">
          <span className="font-semibold text-pino-900">{medicamentos.length}</span>{' '}
          medicamento{medicamentos.length === 1 ? '' : 's'}
          <span className="mx-2 text-salvia-400" aria-hidden="true">/</span>
          {activos} activo{activos === 1 ? '' : 's'}
        </p>
      </header>

      <div className="hidden lg:block">
        <Table className="table-fixed min-w-0!">
          <caption className="sr-only">Medicamentos de {adulto?.nombre ?? 'adulto no disponible'}</caption>
          <thead className="bg-salvia-50/60">
            <tr>
              <Th className="w-[22%] pl-5">Medicamento</Th>
              <Th className="w-[12%]">Dosis</Th>
              <Th className="w-[28%]">Instrucciones</Th>
              <Th className="w-[22%]">Periodo</Th>
              <Th className="w-[16%] pr-5">Estado</Th>
            </tr>
          </thead>
          <tbody>
            {medicamentos.map(medicamento => (
              <tr key={medicamento.id} className="align-top transition-colors hover:bg-salvia-50 motion-reduce:transition-none">
                <Td className="break-words py-4 pl-5 font-semibold">{medicamento.nombre}</Td>
                <Td className="break-words py-4">
                  <span className="font-semibold tabular-nums">{medicamento.dosis}</span>{' '}
                  <span className="text-salvia-700">{medicamento.unidad_dosis}</span>
                </Td>
                <Td className="whitespace-pre-wrap break-words py-4 leading-6 text-salvia-700!">
                  {medicamento.instrucciones?.trim() || 'Sin instrucciones registradas'}
                </Td>
                <Td className="py-4"><PeriodoMedicamento medicamento={medicamento} /></Td>
                <Td className="py-4 pr-5"><EstadoMedicamento activo={medicamento.activo} /></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <ul className="divide-y divide-salvia-200 lg:hidden">
        {medicamentos.map(medicamento => (
          <li key={medicamento.id} className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h4 className="min-w-0 flex-1 basis-40 break-words font-semibold text-pino-900">{medicamento.nombre}</h4>
              <EstadoMedicamento activo={medicamento.activo} />
            </div>
            <dl className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-4">
              <div>
                <dt className="text-xs font-medium text-salvia-600">Dosis</dt>
                <dd className="mt-1 break-words text-base font-semibold text-pino-900">
                  {medicamento.dosis} {medicamento.unidad_dosis}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-salvia-600">Periodo</dt>
                <dd className="mt-1 text-pino-950"><PeriodoMedicamento medicamento={medicamento} /></dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs font-medium text-salvia-600">Instrucciones</dt>
                <dd className="mt-1 whitespace-pre-wrap break-words text-sm/6 text-salvia-700">
                  {medicamento.instrucciones?.trim() || 'Sin instrucciones registradas'}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  )
}
