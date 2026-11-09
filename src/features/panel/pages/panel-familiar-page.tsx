import type { ReactNode } from 'react'
import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { AccionesAlerta, useAlertas, useAlertasEnVivo } from '@/features/alertas'
import { useDispositivos } from '@/features/dispositivos'
import { useMisAdultos, type AdultoVinculado } from '@/features/familiares'
import { useMedicamentos } from '@/features/medicamentos'
import { useZonasSeguras } from '@/features/zonas-seguras'
import { formatFechaHora } from '@/lib/format'
import { IconoAlertas, IconoFamiliares, IconoInicio } from '@/lib/iconos'
import { useAuthStore } from '@/stores/auth-store'

import { BloqueConsulta, IndicadorPanel, enlacePanel, tarjetaPanel } from '../components/resumen-panel'
import { TarjetaAdultoFamiliar } from '../components/tarjeta-adulto-familiar'
import { contarListado } from '../utils/resumen-admin'
import { resumirAlertasFamiliares, resumirVinculosFamiliares } from '../utils/resumen-familiar'

const LIMITE = 500
const severidades = { CRITICA: 'Crítica', ALTA: 'Alta', MEDIA: 'Media', BAJA: 'Baja' }

function CabeceraFamiliar({ children }: { children?: ReactNode }) {
  const nombre = useAuthStore(state => state.usuario?.nombre)
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-1 basis-72">
        <p className="text-sm font-medium text-salvia-700">Seguimiento familiar</p>
        <h1 className="mt-1 flex items-center gap-2.5 font-display text-2xl font-semibold text-pino-900">
          <IconoInicio size={24} className="shrink-0 text-pino-600" />
          <span className="min-w-0 break-words">{nombre ? `Hola, ${nombre}` : 'Tu inicio familiar'}</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm/6 text-salvia-700">Revisa las alertas y el seguimiento de los adultos mayores que acompañas.</p>
      </div>
      {children}
    </header>
  )
}

export function PanelFamiliarPage() {
  const rol = useAuthStore(state => state.usuario?.rol.codigo)
  const adultos = useMisAdultos(rol === 'FAMILIAR_ENCARGADO')
  const { activos, limitado } = resumirVinculosFamiliares(adultos.data ?? [])

  if (adultos.isSuccess && activos.length > 0) {
    return <ResumenFamiliar adultos={activos} consultaAdultos={adultos} vinculosLimitados={limitado} />
  }

  return (
    <section className="space-y-6">
      <CabeceraFamiliar />
      {adultos.isPending ? (
        <div role="status" className={`${tarjetaPanel} flex items-center gap-3 text-sm text-salvia-700`}>
          <Spinner size="sm" label="Cargando adultos vinculados" />Cargando tu seguimiento…
        </div>
      ) : adultos.isError ? (
        <div className={`${tarjetaPanel} space-y-4`}>
          <Alert variant="error">No se pudieron cargar tus adultos vinculados. Verifica tu conexión e intenta de nuevo.</Alert>
          <Button variant="secondary" onClick={() => void adultos.refetch()}>Reintentar</Button>
        </div>
      ) : (
        <div className={`${tarjetaPanel} py-12 text-center`}>
          <span aria-hidden="true" className="mx-auto grid size-12 place-items-center rounded-full bg-pino-100 text-pino-700"><IconoFamiliares size={25} /></span>
          <h2 className="mt-4 font-display text-xl font-semibold text-pino-900">{limitado ? 'No hay vínculos activos en la selección consultada' : 'Aún no tienes vínculos activos'}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm/6 text-salvia-700">{limitado ? 'La consulta alcanzó su límite de 100 vínculos y puede haber más. Revisa tus vínculos e invitaciones.' : 'Cuando un adulto acepte tu invitación, podrás consultar aquí sus alertas y el seguimiento que te haya autorizado.'}</p>
          <Link to="/panel/familiares" className={`${enlacePanel} mt-4`}>Revisar vínculos e invitaciones</Link>
        </div>
      )}
    </section>
  )
}

function ResumenFamiliar({ adultos, consultaAdultos, vinculosLimitados }: {
  adultos: AdultoVinculado[]
  consultaAdultos: ReturnType<typeof useMisAdultos>
  vinculosLimitados: boolean
}) {
  const queryClient = useQueryClient()
  const ubicacionesActualizando = useIsFetching({ queryKey: ['ubicaciones', 'actual'] })
  const abiertas = useAlertas({ estado: 'ABIERTA', limite: LIMITE })
  const enAtencion = useAlertas({ estado: 'EN_ATENCION', limite: LIMITE })
  const estadoStream = useAlertasEnVivo()
  const puedeVerMedicamentos = adultos.some(adulto => adulto.puede_gestionar_medicamentos)
  const medicamentos = useMedicamentos({ soloActivos: true, limite: LIMITE }, puedeVerMedicamentos)
  const zonas = useZonasSeguras()
  const dispositivos = useDispositivos({ soloActivas: true, limite: LIMITE })

  const ids = new Set(adultos.map(adulto => adulto.id))
  const idsMedicamentos = new Set(adultos.filter(adulto => adulto.puede_gestionar_medicamentos).map(adulto => adulto.id))
  const nombres = new Map(adultos.map(adulto => [adulto.id, `${adulto.nombre} ${adulto.apellido}`]))
  const todasAlertas = [...(abiertas.data ?? []), ...(enAtencion.data ?? [])]
  const resumen = resumirAlertasFamiliares(adultos, todasAlertas)
  const limiteConsultasAlertas = (abiertas.data?.length ?? 0) >= LIMITE || (enAtencion.data?.length ?? 0) >= LIMITE
  const limiteAlertas = vinculosLimitados || limiteConsultasAlertas
  const consultaPendientes = {
    isPending: abiertas.isPending || enAtencion.isPending,
    isError: abiertas.isError || enAtencion.isError,
    refetch: async () => { await Promise.all([abiertas.refetch(), enAtencion.refetch()]) },
  }
  const consultas = [consultaAdultos, abiertas, enAtencion, zonas, dispositivos,
    ...(puedeVerMedicamentos ? [medicamentos] : [])]
  const actualizando = consultas.some(consulta => consulta.isFetching) || ubicacionesActualizando > 0
  const medicamentosActivos = (medicamentos.data ?? []).filter(medicamento => idsMedicamentos.has(medicamento.adulto_id) && medicamento.activo)
  const zonasActivas = (zonas.data ?? []).filter(zona => ids.has(zona.adulto_id) && zona.activa)
  const dispositivosActivos = (dispositivos.data ?? []).filter(dispositivo => ids.has(dispositivo.usuario_id) && dispositivo.activo)

  function actualizarResumen() {
    return Promise.all([
      ...consultas.map(consulta => consulta.refetch()),
      queryClient.invalidateQueries({ queryKey: ['ubicaciones', 'actual'] }),
    ])
  }

  return (
    <section className="space-y-6">
      <CabeceraFamiliar>
        <div className="flex flex-wrap items-center gap-3">
          {estadoStream === 'conectado' && <span className="rounded-full bg-pino-100 px-3 py-1 text-xs font-medium text-pino-800">Alertas en vivo</span>}
          {estadoStream === 'error' && <span role="status" className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">Reconectando alertas…</span>}
          <Button variant="secondary" disabled={actualizando} onClick={() => void actualizarResumen()}>{actualizando ? 'Actualizando…' : 'Actualizar resumen'}</Button>
        </div>
      </CabeceraFamiliar>

      {vinculosLimitados && <Alert>Se consultaron hasta 100 vínculos. Este resumen corresponde a los adultos incluidos en esa selección; puede haber más vínculos y registros. Los conteos con + son mínimos.</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <IndicadorPanel titulo="Adultos a tu cargo" valor={`${adultos.length}${vinculosLimitados ? '+' : ''}`} descripcion="Vínculos activos de tu cuenta" to="/panel/familiares" consulta={consultaAdultos} />
        <IndicadorPanel titulo="Alertas abiertas" valor={contarListado(resumen.abiertas, LIMITE, vinculosLimitados ? LIMITE : abiertas.data?.length)} descripcion="Pendientes de atención" to="/panel/alertas" consulta={abiertas} urgente={resumen.abiertas > 0} />
        <IndicadorPanel titulo="En atención" valor={contarListado(resumen.enAtencion, LIMITE, vinculosLimitados ? LIMITE : enAtencion.data?.length)} descripcion="Con seguimiento iniciado" to="/panel/alertas" consulta={enAtencion} />
        <IndicadorPanel titulo="Críticas pendientes" valor={`${resumen.criticas}${limiteAlertas ? '+' : ''}`} descripcion="Abiertas o en atención" to="/panel/alertas" consulta={consultaPendientes} urgente={resumen.criticas > 0} />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
        <section className={tarjetaPanel} aria-labelledby="titulo-alertas-familiares">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="titulo-alertas-familiares" className="flex items-center gap-2 font-display text-lg font-semibold text-pino-900"><IconoAlertas size={20} />Prioridad de atención</h2>
            <Link to="/panel/alertas" className={enlacePanel}>Ver todas las alertas</Link>
          </div>
          <p className="mt-1 text-sm/6 text-salvia-700">Hasta 6 alertas pendientes, ordenadas por severidad y después por antigüedad.</p>
          {limiteAlertas && <p className="mt-3 text-sm text-amber-900">Se alcanzó el límite de consulta. Los conteos con + son mínimos y puede haber más alertas pendientes.</p>}
          {consultaPendientes.isPending && <p role="status" className="mt-4 text-sm text-salvia-700">Cargando alertas pendientes…</p>}
          {consultaPendientes.isError && <div className="mt-4 space-y-3"><Alert variant="error">No se pudieron cargar todas las alertas. El resumen puede estar incompleto.</Alert><Button variant="secondary" onClick={() => void consultaPendientes.refetch()}>Reintentar alertas</Button></div>}
          {resumen.prioritarias.length > 0 ? (
            <ul className="mt-3 divide-y divide-salvia-200">
              {resumen.prioritarias.map(alerta => (
                <li key={alerta.id} className="space-y-3 py-4">
                  <div className="flex flex-wrap gap-2 text-xs font-medium">
                    <span className={`rounded-full px-2.5 py-1 ${alerta.severidad === 'CRITICA' ? 'bg-red-100 text-red-900' : alerta.severidad === 'ALTA' ? 'bg-amber-100 text-amber-900' : 'bg-salvia-100 text-salvia-800'}`}>{severidades[alerta.severidad]}</span>
                    <span className="rounded-full bg-salvia-100 px-2.5 py-1 text-salvia-800">{alerta.estado === 'ABIERTA' ? 'Abierta' : 'En atención'}</span>
                  </div>
                  <div>
                    <h3 className="break-words font-semibold text-pino-900">{alerta.titulo}</h3>
                    <p className="mt-1 text-sm text-salvia-700">{nombres.get(alerta.adulto_id)}</p>
                    {alerta.descripcion && <p className="mt-1 break-words text-sm/6 text-salvia-700">{alerta.descripcion}</p>}
                    <p className="mt-1 text-xs text-salvia-600">Ocurrida: <time dateTime={alerta.ocurrida_en}>{formatFechaHora(alerta.ocurrida_en)}</time></p>
                  </div>
                  <AccionesAlerta alerta={alerta} origen="familiar" />
                </li>
              ))}
            </ul>
          ) : !consultaPendientes.isPending && !consultaPendientes.isError && (
            <p className="mt-5 rounded-lg bg-pino-50 p-4 text-sm text-pino-900">{limiteAlertas ? 'No hay alertas pendientes entre los registros consultados.' : 'Tus adultos vinculados no tienen alertas abiertas ni en atención.'}</p>
          )}
        </section>

        <div className="space-y-6">
          <section className={tarjetaPanel} aria-labelledby="titulo-cuidado-familiar">
            <h2 id="titulo-cuidado-familiar" className="font-display text-lg font-semibold text-pino-900">Resumen del cuidado</h2>
            <div className="mt-3 divide-y divide-salvia-200">
              <div className="py-3">
                <Link to="/panel/medicamentos" className={enlacePanel}>Medicamentos activos</Link>
                {puedeVerMedicamentos ? <BloqueConsulta consulta={medicamentos} nombre="medicamentos"><p className="text-2xl font-semibold text-pino-900">{contarListado(medicamentosActivos.length, LIMITE, vinculosLimitados ? LIMITE : medicamentos.data?.length)}</p><p className="mt-1 text-sm text-salvia-700">De los adultos que te autorizaron a gestionar medicamentos.</p></BloqueConsulta> : <p className="text-sm/6 text-salvia-700">{vinculosLimitados ? 'Los vínculos consultados no incluyen gestión de medicamentos.' : 'Tus vínculos actuales no incluyen gestión de medicamentos.'}</p>}
              </div>
              <div className="py-3">
                <Link to="/panel/zonas-seguras" className={enlacePanel}>Zonas seguras activas</Link>
                <BloqueConsulta consulta={zonas} nombre="zonas seguras"><p className="text-2xl font-semibold text-pino-900">{contarListado(zonasActivas.length, 100, vinculosLimitados ? 100 : zonas.data?.length)}</p></BloqueConsulta>
              </div>
              <div className="pt-3">
                <Link to="/panel/dispositivos" className={enlacePanel}>Dispositivos activos</Link>
                <BloqueConsulta consulta={dispositivos} nombre="dispositivos"><p className="text-2xl font-semibold text-pino-900">{contarListado(dispositivosActivos.length, LIMITE, vinculosLimitados ? LIMITE : dispositivos.data?.length)}</p><p className="mt-1 text-sm/6 text-salvia-700">De tus adultos vinculados. Un dispositivo habilitado no confirma conexión.</p></BloqueConsulta>
              </div>
            </div>
            <p className="mt-4 text-xs/5 text-salvia-600">Un + indica un conteo mínimo: la consulta alcanzó su límite de registros.</p>
          </section>
          <nav className={tarjetaPanel} aria-label="Accesos de seguimiento familiar">
            <h2 className="font-display text-lg font-semibold text-pino-900">Tu seguimiento diario</h2>
            <div className="mt-3 grid gap-1">
              <Link to="/panel/ubicaciones" className={enlacePanel}>Consultar ubicaciones</Link>
              <Link to="/panel/medicamentos" className={enlacePanel}>Medicamentos y tomas</Link>
              <Link to="/panel/contactos" className={enlacePanel}>Contactos de apoyo</Link>
              <Link to="/panel/whatsapp" className={enlacePanel}>Notificaciones por WhatsApp</Link>
              <Link to="/panel/familiares" className={enlacePanel}>Vínculos e invitaciones</Link>
            </div>
          </nav>
        </div>
      </div>

      <section aria-labelledby="titulo-adultos-familiares">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div><h2 id="titulo-adultos-familiares" className="font-display text-lg font-semibold text-pino-900">Adultos que acompañas</h2><p className="mt-1 text-sm text-salvia-700">La fecha de cada reporte indica cuándo se registró la última ubicación conocida.</p></div>
          <Link to="/panel/familiares" className={enlacePanel}>Administrar vínculos</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {adultos.map(adulto => {
            const pendientes = resumirAlertasFamiliares([adulto], todasAlertas)
            return <TarjetaAdultoFamiliar key={adulto.vinculo_id} adulto={adulto} pendientes={pendientes.abiertas + pendientes.enAtencion} errorAlertas={consultaPendientes.isError} cargandoAlertas={consultaPendientes.isPending} conteoLimitado={limiteConsultasAlertas} />
          })}
        </div>
      </section>
    </section>
  )
}
