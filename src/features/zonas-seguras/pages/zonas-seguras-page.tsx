/**
 * Zonas seguras (/panel/zonas-seguras).
 * Pendiente de implementar según el contrato del backend
 * (zonas-seguras.controller.ts).
 */
import { IconoZonasSeguras } from '@/lib/iconos'

export function ZonasSegurasPage() {
  return (
    <section className="space-y-4">
      <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-pino-900">
        <IconoZonasSeguras size={24} className="text-pino-600" />
        Zonas seguras
      </h1>
      <p className="max-w-2xl text-sm/6 text-salvia-700">
        Administración de zonas seguras del adulto mayor. Pendiente de
        implementar.
      </p>
    </section>
  )
}
