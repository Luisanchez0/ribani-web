/**
 * Dashboard del panel familiar (/panel).
 * Pendiente de implementar: consumirá los datos del backend mediante
 * TanStack Query una vez generados los tipos en types/api.d.ts.
 */
import { IconoInicio } from '@/lib/iconos'

export function PanelPage() {
  return (
    <section className="space-y-4">
      <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-pino-900">
        <IconoInicio size={24} className="text-pino-600" />
        Panel
      </h1>
      <p className="max-w-2xl text-sm/6 text-salvia-700">
        Resumen del seguimiento diario del adulto mayor. Aquí se integrarán
        ubicación, alertas, medicamentos y dispositivos.
      </p>
    </section>
  )
}
