import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { Alert } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { useAlertas } from '@/features/alertas/api/alertas.api'
import type { Alerta } from '@/features/alertas/api/alertas.api'
import { useMisAdultos } from '@/features/familiares'
import { useUbicacionActual } from '@/features/ubicaciones/hooks'
import { useAdultos } from '@/features/usuarios'
import { useZonasSeguras } from '@/features/zonas-seguras/hooks/use-zonas-seguras'
import { useAuthStore } from '@/stores/auth-store'
import { IconoInicio } from '@/lib/iconos'

/** Adulto mostrado en el resumen, venga de mis-adultos o del listado admin. */
type AdultoResumen = {
  id: string
  nombre: string
  apellido: string
  parentesco?: string | null
}

/** Tarjeta de resumen de un adulto con su última ubicación conocida. */
function TarjetaAdulto({ adulto }: { adulto: AdultoResumen }) {
  const ubicacion = useUbicacionActual(adulto.id)

  return (
    <div className="rounded-lg border border-salvia-200 bg-white p-4 shadow-sm">
      <p className="font-medium text-pino-900">
        {adulto.nombre} {adulto.apellido}
      </p>
      {adulto.parentesco && (
        <p className="text-xs text-salvia-600">{adulto.parentesco}</p>
      )}
      <div className="mt-3 text-sm text-salvia-700">
        {ubicacion.isPending ? (
          <span className="inline-flex items-center gap-2">
            <Spinner size="sm" label="Cargando ubicación" />
            Buscando ubicación…
          </span>
        ) : ubicacion.isError ? (
          <span className="text-amber-800">Ubicación no disponible</span>
        ) : ubicacion.data ? (
          <span>
            Última ubicación: {ubicacion.data.latitud.toFixed(5)},{' '}
            {ubicacion.data.longitud.toFixed(5)}
          </span>
        ) : (
          <span>Sin ubicación registrada aún</span>
        )}
      </div>
      <Link
        to="/panel/ubicaciones"
        className="mt-3 inline-block text-sm font-medium text-pino-700 underline underline-offset-2 hover:text-pino-900"
      >
        Ver en mapa
      </Link>
    </div>
  )
}

function FilaAlerta({
  alerta,
  nombreAdulto,
}: {
  alerta: Alerta
  nombreAdulto: string
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3">
      <div>
        <p className="text-sm font-medium text-pino-900">{alerta.titulo}</p>
        <p className="text-xs text-salvia-600">
          {nombreAdulto} · {alerta.tipo} · severidad {alerta.severidad.toLowerCase()}
        </p>
      </div>
      <time className="text-xs text-salvia-600" dateTime={alerta.ocurrida_en}>
        {new Date(alerta.ocurrida_en).toLocaleString('es-MX')}
      </time>
    </li>
  )
}

/**
 * Inicio del panel familiar (/panel).
 * Resumen con datos reales: adultos a cargo, su última ubicación,
 * alertas abiertas y zonas seguras activas.
 */
/** Traduce el error del resumen; un 403 indica que falta el permiso para listar usuarios. */
function mensajeDeResumen(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'status' in error.response &&
    error.response.status === 403
  ) {
    return 'Tu cuenta no tiene permiso para ver los adultos mayores (usuarios.leer).'
  }

  return 'No se pudo cargar tu resumen. Verifica tu conexión e intenta de nuevo.'
}

export function PanelPage() {
  const rol = useAuthStore((state) => state.usuario?.rol.codigo)
  const esAdmin = rol === 'ADMINISTRADOR'
  // El admin usa el listado de adultos; el familiar, sus vínculos (mis-adultos).
  const adultosFamilia = useMisAdultos(rol === 'FAMILIAR_ENCARGADO')
  const adultosAdmin = useAdultos(esAdmin)
  const adultos = esAdmin ? adultosAdmin : adultosFamilia
  const alertas = useAlertas({ estado: 'ABIERTA', limite: 5 })
  const zonas = useZonasSeguras(undefined, true)

  const activos: AdultoResumen[] = useMemo(() => {
    if (esAdmin) return adultosAdmin.data ?? []
    return (adultosFamilia.data ?? []).filter((a) => a.estado === 'ACTIVA')
  }, [esAdmin, adultosAdmin.data, adultosFamilia.data])

  const nombresAdultos = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const adulto of activos) {
      mapa.set(adulto.id, `${adulto.nombre} ${adulto.apellido}`)
    }
    return mapa
  }, [activos])

  const resumen = [
    {
      etiqueta: 'Adultos a cargo',
      valor: adultos.data ? String(activos.length) : '—',
      enlace: '/panel/familiares',
    },
    {
      etiqueta: 'Alertas abiertas',
      valor: alertas.data ? String(alertas.data.length) : '—',
      enlace: '/panel/alertas',
    },
    {
      etiqueta: 'Zonas seguras activas',
      valor: zonas.data ? String(zonas.data.length) : '—',
      enlace: '/panel/zonas-seguras',
    },
  ]

  return (
    <section className="space-y-6">
      <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-pino-900">
        <IconoInicio size={24} className="text-pino-600" />
        Inicio
      </h1>

      {adultos.isPending ? (
        <div className="flex items-center gap-3 rounded-lg border border-salvia-200 bg-white p-6 text-sm text-salvia-600">
          <Spinner size="sm" label="Cargando resumen" />
          Cargando resumen…
        </div>
      ) : adultos.isError ? (
        <Alert variant="error">{mensajeDeResumen(adultos.error)}</Alert>
      ) : activos.length === 0 ? (
        <div className="rounded-lg border border-salvia-200 bg-white p-10 text-center">
          <p className="text-sm font-medium text-pino-900">
            No tienes adultos mayores vinculados
          </p>
          <p className="mt-1 text-sm text-salvia-600">
            Cuando tengas un vínculo activo, verás aquí su ubicación, alertas y
            zonas seguras.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {resumen.map((item) => (
              <Link
                key={item.etiqueta}
                to={item.enlace}
                className="rounded-lg border border-salvia-200 bg-white p-4 shadow-sm hover:border-pino-400"
              >
                <p className="text-sm text-salvia-700">{item.etiqueta}</p>
                <p className="mt-1 font-display text-3xl font-semibold text-pino-900">
                  {item.valor}
                </p>
              </Link>
            ))}
          </div>

          <div>
            <h2 className="mb-3 font-display text-lg font-semibold text-pino-900">
              Adultos mayores
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {activos.map((adulto) => (
                <TarjetaAdulto key={adulto.id} adulto={adulto} />
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-salvia-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-pino-900">
              Alertas abiertas
            </h2>
            {alertas.isPending ? (
              <div className="flex items-center gap-3 py-4 text-sm text-salvia-600">
                <Spinner size="sm" label="Cargando alertas" />
                Cargando alertas…
              </div>
            ) : alertas.isError ? (
              <div className="mt-3">
                <Alert variant="error">No se pudieron cargar las alertas.</Alert>
              </div>
            ) : alertas.data.length === 0 ? (
              <p className="mt-2 text-sm text-salvia-600">
                No hay alertas abiertas. Todo en orden.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-salvia-100">
                {alertas.data.map((alerta) => (
                  <FilaAlerta
                    key={alerta.id}
                    alerta={alerta}
                    nombreAdulto={
                      nombresAdultos.get(alerta.adulto_id) ?? 'Adulto mayor'
                    }
                  />
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  )
}
