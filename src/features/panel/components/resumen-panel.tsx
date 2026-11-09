import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export const enlacePanel = 'inline-flex min-h-11 items-center text-sm font-medium text-pino-700 underline underline-offset-4 hover:text-pino-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600'
export const tarjetaPanel = 'rounded-xl border border-salvia-200 bg-white p-5 shadow-sm'

export type ConsultaResumen = {
  isPending: boolean
  isError: boolean
  refetch: () => Promise<unknown>
}

export function BloqueConsulta({ consulta, nombre, children }: {
  consulta: ConsultaResumen
  nombre: string
  children: ReactNode
}) {
  if (consulta.isPending) {
    return (
      <div className="flex items-center gap-2 py-5 text-sm text-salvia-700" role="status">
        <Spinner size="sm" label={`Cargando ${nombre}`} />Cargando {nombre}…
      </div>
    )
  }
  if (consulta.isError) {
    return (
      <div className="space-y-3 py-3">
        <Alert variant="error">No se pudo cargar {nombre}.</Alert>
        <Button variant="secondary" onClick={() => void consulta.refetch()}>Reintentar</Button>
      </div>
    )
  }
  return children
}

export function IndicadorPanel({ titulo, valor, descripcion, to, consulta, urgente = false }: {
  titulo: string
  valor: string
  descripcion: string
  to: string
  consulta: ConsultaResumen
  urgente?: boolean
}) {
  return (
    <div className={`${tarjetaPanel} ${urgente ? 'border-red-200 bg-red-50/50' : ''}`}>
      <Link to={to} className={enlacePanel}>{titulo}</Link>
      <BloqueConsulta consulta={consulta} nombre={titulo.toLowerCase()}>
        <p className={`mt-2 font-display text-4xl font-semibold tabular-nums ${urgente ? 'text-red-800' : 'text-pino-900'}`}>
          {valor}
        </p>
        <p className="mt-2 text-sm text-salvia-700">{descripcion}</p>
      </BloqueConsulta>
    </div>
  )
}
