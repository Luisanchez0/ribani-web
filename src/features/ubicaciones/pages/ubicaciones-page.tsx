/**
 * Ubicación del adulto mayor (/panel/ubicaciones).
 * Pendiente de implementar:
 * - mapa con react-leaflet + OpenStreetMap
 * - stream en tiempo real vía hook sobre lib/sse.ts (SSE)
 * - distinguir última ubicación conocida de la ubicación en tiempo real
 */
export function UbicacionesPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Ubicaciones</h1>
      <p className="max-w-2xl text-sm text-slate-600">
        Ubicación en tiempo real del adulto mayor. Pendiente de implementar.
      </p>
    </section>
  )
}
