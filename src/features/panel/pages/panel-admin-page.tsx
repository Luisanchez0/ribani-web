import { Link } from 'react-router-dom'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AccionesAlerta, useAlertas } from '@/features/alertas'
import { useDispositivos } from '@/features/dispositivos'
import { useUltimasUbicaciones } from '@/features/ubicaciones'
import { useUsuarios } from '@/features/usuarios'
import { useZonasSeguras } from '@/features/zonas-seguras'
import { esCoordenadaValida, formatFechaHora } from '@/lib/format'
import { IconoAlertas, IconoInicio } from '@/lib/iconos'

import { contarListado, resumirAlertasPendientes } from '../utils/resumen-admin'
import {
  BloqueConsulta,
  IndicadorPanel as Indicador,
  enlacePanel as enlace,
  tarjetaPanel as tarjeta,
} from '../components/resumen-panel'

const LIMITE = 500
const severidades = { CRITICA: 'Crítica', ALTA: 'Alta', MEDIA: 'Media', BAJA: 'Baja' }

/** Inicio administrativo: cada bloque mantiene sus propios estados de consulta. */
export function PanelAdminPage() {
  const abiertas = useAlertas({ estado: 'ABIERTA', limite: LIMITE }, 30_000)
  const enAtencion = useAlertas({ estado: 'EN_ATENCION', limite: LIMITE }, 30_000)
  const adultos = useUsuarios({ rol: 'ADULTO_MAYOR' })
  const usuarios = useUsuarios()
  const dispositivos = useDispositivos({ soloActivas: true, limite: LIMITE })
  const ubicaciones = useUltimasUbicaciones()
  const zonas = useZonasSeguras()
  const resumen = resumirAlertasPendientes([...(abiertas.data ?? []), ...(enAtencion.data ?? [])])
  const limiteAlertas = (abiertas.data?.length ?? 0) >= LIMITE || (enAtencion.data?.length ?? 0) >= LIMITE
  const consultaPendientes = {
    isPending: abiertas.isPending || enAtencion.isPending,
    isError: abiertas.isError || enAtencion.isError,
    refetch: async () => { await Promise.all([abiertas.refetch(), enAtencion.refetch()]) },
  }
  const nombres = new Map((adultos.data ?? []).map(a => [a.id, `${a.nombre} ${a.apellido}`]))
  const reportes = (ubicaciones.data ?? []).filter(u => esCoordenadaValida(u.latitud, u.longitud))
    .toSorted((a, b) => Date.parse(b.registrada_en) - Date.parse(a.registrada_en)).slice(0, 4)
  const consultas = [abiertas, enAtencion, adultos, usuarios, dispositivos, ubicaciones, zonas]
  const actualizando = consultas.some(c => c.isFetching)

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-salvia-700">Administración</p>
          <h1 className="mt-1 flex items-center gap-2.5 font-display text-2xl font-semibold text-pino-900"><IconoInicio size={24} className="text-pino-600" />Inicio del sistema</h1>
          <p className="mt-2 max-w-2xl text-sm/6 text-salvia-700">Revisa las alertas que necesitan atención y el estado del seguimiento de los adultos mayores.</p>
        </div>
        <Button variant="secondary" disabled={actualizando} onClick={() => void Promise.all(consultas.map(c => c.refetch()))}>{actualizando ? 'Actualizando…' : 'Actualizar resumen'}</Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador titulo="Alertas abiertas" valor={contarListado(resumen.abiertas, LIMITE, abiertas.data?.length)} descripcion="Pendientes de atención" to="/admin/alertas" consulta={abiertas} urgente={resumen.abiertas > 0} />
        <Indicador titulo="En atención" valor={contarListado(resumen.enAtencion, LIMITE, enAtencion.data?.length)} descripcion="Con seguimiento iniciado" to="/admin/alertas" consulta={enAtencion} />
        <Indicador titulo="Críticas pendientes" valor={`${resumen.criticas}${limiteAlertas ? '+' : ''}`} descripcion="Abiertas o en atención" to="/admin/alertas" consulta={consultaPendientes} urgente={resumen.criticas > 0} />
        <Indicador titulo="Adultos activos" valor={String(adultos.data?.filter(a => a.activo).length ?? 0)} descripcion="Cuentas habilitadas en el sistema" to="/admin/usuarios" consulta={adultos} />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
        <section className={tarjeta} aria-labelledby="titulo-pendientes">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="titulo-pendientes" className="flex items-center gap-2 font-display text-lg font-semibold text-pino-900"><IconoAlertas size={20} />Prioridad de atención</h2>
            <Link to="/admin/alertas" className={enlace}>Ver todas las alertas</Link>
          </div>
          <p className="mt-1 text-sm text-salvia-700">Hasta 6 pendientes, por severidad y después por antigüedad. Actualización cada 30 segundos.</p>
          {limiteAlertas && <p className="mt-3 text-sm text-amber-900">Se alcanzó el límite de consulta. Los conteos con + son mínimos; filtra por adulto en Alertas para revisar más registros.</p>}
          {(abiertas.isPending || enAtencion.isPending) && <p role="status" className="mt-4 text-sm text-salvia-700">Cargando alertas pendientes…</p>}
          {(abiertas.isError || enAtencion.isError) && <div className="mt-4 space-y-2"><Alert variant="error">No se pudieron cargar todas las alertas pendientes. El resumen puede estar incompleto.</Alert><Button variant="secondary" onClick={() => void consultaPendientes.refetch()}>Reintentar alertas</Button></div>}
          {resumen.prioritarias.length > 0 ? <ul className="mt-4 divide-y divide-salvia-200">
            {resumen.prioritarias.map(alerta => <li key={alerta.id} className="space-y-3 py-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                <span className={`rounded-full px-2.5 py-1 ${alerta.severidad === 'CRITICA' ? 'bg-red-100 text-red-900' : alerta.severidad === 'ALTA' ? 'bg-amber-100 text-amber-900' : 'bg-salvia-100 text-salvia-800'}`}>{severidades[alerta.severidad]}</span>
                <span className="rounded-full bg-salvia-100 px-2.5 py-1 text-salvia-800">{alerta.estado === 'ABIERTA' ? 'Abierta' : 'En atención'}</span>
              </div>
              <div>
                <h3 className="font-semibold text-pino-900">{alerta.titulo}</h3>
                <p className="mt-1 text-sm text-salvia-700">{nombres.get(alerta.adulto_id) ?? `Adulto ${alerta.adulto_id}`}</p>
                {alerta.descripcion && <p className="mt-1 break-words text-sm text-salvia-700">{alerta.descripcion}</p>}
                <p className="mt-1 text-xs text-salvia-600">Ocurrida: <time dateTime={alerta.ocurrida_en}>{formatFechaHora(alerta.ocurrida_en)}</time></p>
              </div>
              <AccionesAlerta alerta={alerta} />
            </li>)}
          </ul> : !consultaPendientes.isPending && !consultaPendientes.isError && <p className="mt-5 rounded-lg bg-pino-50 p-4 text-sm text-pino-900">No hay alertas abiertas ni en atención.</p>}
        </section>

        <div className="space-y-6">
          <section className={tarjeta} aria-labelledby="titulo-cobertura">
            <h2 id="titulo-cobertura" className="font-display text-lg font-semibold text-pino-900">Seguimiento y cobertura</h2>
            <div className="mt-4 divide-y divide-salvia-200">
              <div className="py-3"><Link to="/panel/dispositivos" className={enlace}>Dispositivos activos</Link><BloqueConsulta consulta={dispositivos} nombre="dispositivos"><p className="text-2xl font-semibold text-pino-900">{contarListado(dispositivos.data?.length ?? 0, LIMITE)}</p><p className="mt-1 text-sm text-salvia-700">Registrados y habilitados; su estado no confirma conexión.</p></BloqueConsulta></div>
              <div className="py-3"><Link to="/panel/zonas-seguras" className={enlace}>Zonas seguras activas</Link><BloqueConsulta consulta={zonas} nombre="zonas seguras"><p className="text-2xl font-semibold text-pino-900">{contarListado(zonas.data?.length ?? 0, 100)}</p></BloqueConsulta></div>
              <div className="pt-3"><Link to="/admin/usuarios" className={enlace}>Usuarios registrados</Link><BloqueConsulta consulta={usuarios} nombre="usuarios"><p className="text-2xl font-semibold text-pino-900">{usuarios.data?.length ?? 0}</p><p className="mt-1 text-sm text-salvia-700">{usuarios.data?.filter(u => u.activo).length ?? 0} cuentas activas.</p></BloqueConsulta></div>
            </div>
            <p className="mt-4 text-xs/5 text-salvia-600">Un + indica que se alcanzó el límite de la consulta y puede haber más registros.</p>
          </section>
          <nav className={tarjeta} aria-label="Accesos de administración">
            <h2 className="font-display text-lg font-semibold text-pino-900">Gestión del sistema</h2>
            <div className="mt-3 grid gap-1"><Link to="/admin/relaciones" className={enlace}>Relaciones familiares</Link><Link to="/admin/usuarios" className={enlace}>Administrar usuarios</Link><Link to="/admin/roles" className={enlace}>Roles y permisos</Link><Link to="/admin/auditoria" className={enlace}>Consultar auditoría</Link></div>
          </nav>
        </div>
      </div>

      <section className={tarjeta} aria-labelledby="titulo-reportes">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="titulo-reportes" className="font-display text-lg font-semibold text-pino-900">Últimas ubicaciones conocidas</h2><Link to="/admin/ubicaciones" className={enlace}>Abrir mapa de adultos</Link></div>
        <p className="mt-1 text-sm text-salvia-700">Reportes más recientes disponibles. La fecha indica cuándo se registró cada ubicación.</p>
        <BloqueConsulta consulta={ubicaciones} nombre="ubicaciones">
          {reportes.length === 0 ? <p className="mt-4 text-sm text-salvia-700">No hay ubicaciones válidas registradas.</p> : <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{reportes.map(reporte => <li key={reporte.adulto_id} className="rounded-lg border border-salvia-200 p-4"><p className="font-medium text-pino-900">{reporte.nombre} {reporte.apellido}</p><p className="mt-2 text-sm text-salvia-700">Última actualización</p><time className="mt-1 block text-sm font-medium text-pino-800" dateTime={reporte.registrada_en}>{formatFechaHora(reporte.registrada_en)}</time></li>)}</ul>}
        </BloqueConsulta>
      </section>
    </section>
  )
}
