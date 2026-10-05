/**
 * Dashboard del panel familiar (/panel).
 * Pendiente de implementar: consumirá los datos del backend mediante
 * TanStack Query una vez generados los tipos en types/api.d.ts.
 */
export function PanelPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Panel</h1>
      <p className="max-w-2xl text-sm text-slate-600">
        Resumen del seguimiento diario del adulto mayor. Aquí se integrarán
        ubicación, alertas, medicamentos y dispositivos.
      </p>
    </section>
  )
}
