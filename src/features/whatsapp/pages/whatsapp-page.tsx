import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Alert } from '@/components/ui/alert'
import { PAISES_TELEFONO } from '@/features/auth'
import { contactosApi } from '@/features/contactos'
import { useAdultos } from '@/features/usuarios'
import { useMisAdultos } from '@/features/familiares'
import { formatFechaHora } from '@/lib/format'
import { useAuthStore } from '@/stores/auth-store'
import { BARRA_FILTROS } from '@/lib/clases-filtros'
import {
  whatsappApi,
  type Destinatario,
  type Preferencias,
  type PreferenciasEntrada,
} from '../api/whatsapp.api'
import {
  usePreferenciasWhatsapp,
  useResumenWhatsapp,
  useWhatsapp,
} from '../hooks/use-whatsapp'
import { etiquetaWhatsapp, filtrarHistorialWhatsapp } from '../utils/estados'

const seccion = 'min-w-0 scroll-mt-6 space-y-5 rounded-xl border border-salvia-200 bg-white p-5 shadow-sm sm:p-6'
const campo = 'block space-y-2 text-sm font-medium text-pino-900'
const estadoVacio = 'rounded-lg border border-dashed border-salvia-300 bg-salvia-50 p-5 text-sm leading-6 text-salvia-700'
const casilla = 'mt-0.5 size-5 shrink-0 accent-pino-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600'

/**
 * La BD guarda E.164 (+52, +51...). El formulario separa el código de país
 * para que el usuario no tenga que escribirlo; si el número guardado no
 * coincide con ningún país de la lista se devuelve tal cual.
 */
function partirTelefono(guardado: string | null | undefined): {
  codigo: string
  local: string
} {
  const numero = (guardado ?? '').trim()
  const pais = PAISES_TELEFONO.find((p) => numero.startsWith(p.codigo))
  return pais
    ? { codigo: pais.codigo, local: numero.slice(pais.codigo.length) }
    : { codigo: PAISES_TELEFONO[0].codigo, local: numero.replace(/^\+/, '') }
}

function mensajeError(error: unknown) {
  const body = (error as { response?: { data?: { message?: unknown } } })
    ?.response?.data
  return typeof body?.message === 'string'
    ? body.message
    : 'No se pudo completar la operación. Verifica tus permisos e inténtalo de nuevo.'
}

export function WhatsappPage() {
  const usuario = useAuthStore((s) => s.usuario)
  const admin = usuario?.rol.codigo === 'ADMINISTRADOR'
  const w = useWhatsapp()
  const resumen = useResumenWhatsapp()
  const [codigoPais, setCodigoPais] = useState(
    () => partirTelefono(usuario?.telefono).codigo,
  )
  const [telefono, setTelefono] = useState(
    () => partirTelefono(usuario?.telefono).local,
  )
  const [contactoId, setContactoId] = useState('')
  const [adultoId, setAdultoId] = useState('')
  const [busquedaHistorial, setBusquedaHistorial] = useState('')
  const [estadoHistorial, setEstadoHistorial] = useState('')
  const contactos = useQuery({
    queryKey: ['whatsapp', 'contactos-alta'],
    queryFn: () => contactosApi.listar(),
    enabled: admin,
  })
  const adultosAdmin = useAdultos(admin)
  const adultosFamilia = useMisAdultos(
    usuario?.rol.codigo === 'FAMILIAR_ENCARGADO',
  )
  const adultos = admin ? adultosAdmin : adultosFamilia
  const opcionesAdultos =
    usuario?.rol.codigo === 'ADULTO_MAYOR'
      ? [{ id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido }]
      : admin
        ? (adultosAdmin.data ?? [])
        : (adultosFamilia.data ?? []).filter((a) => a.estado === 'ACTIVA')
  const destinoNombre = new Map(
    w.destinatarios.data?.map((d) => [
      d.id,
      `${d.nombre ?? 'Destinatario'} (${d.telefono_e164})`,
    ]),
  )
  const configurada =
    w.integracion.data?.habilitada &&
    w.integracion.data.prueba_configurada &&
    w.integracion.data.procesador_habilitado
  const mensajesVisibles = filtrarHistorialWhatsapp(
    w.historial.data ?? [],
    busquedaHistorial,
    estadoHistorial,
    destinoNombre,
  )
  const estadosHistorial = [...new Set([
    ...(w.historial.data?.map((n) => n.estado) ?? []),
    ...(estadoHistorial ? [estadoHistorial] : []),
  ])]

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-salvia-200 pb-5">
        <div className="min-w-0 space-y-2">
          <h1 className="font-display text-2xl font-semibold text-pino-900 sm:text-3xl">
            Notificaciones por WhatsApp
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-salvia-700">
            Administra los números que reciben avisos, su consentimiento y el estado de cada mensaje.
          </p>
        </div>
        <nav aria-label="Secciones de WhatsApp" className="flex flex-wrap gap-2 text-sm font-medium text-pino-800">
          {[
            ['destinatarios', 'Destinatarios'],
            ['preferencias', 'Preferencias'],
            ['historial', 'Historial'],
          ].map(([id, nombre]) => (
            <a key={id} href={`#${id}`} className="inline-flex min-h-11 items-center rounded-lg border border-salvia-200 bg-white px-3 py-2 hover:bg-pino-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600">{nombre}</a>
          ))}
        </nav>
      </header>
      {w.integracion.isError ? (
        <Alert>No se pudo consultar la integración.</Alert>
      ) : w.integracion.isPending ? (
        <p role="status" className={estadoVacio}>Consultando el estado de WhatsApp…</p>
      ) : !configurada ? (
        <Alert>
          Los envíos de prueba están deshabilitados. Puedes registrar
          destinatarios y administrar el consentimiento mientras se configura la
          integración.
        </Alert>
      ) : (
        <Alert variant="success">
          WhatsApp está habilitado. Puedes enviar pruebas a los números con consentimiento aceptado.
        </Alert>
      )}
      {w.accion.isError && <Alert>{mensajeError(w.accion.error)}</Alert>}
      {w.accion.isSuccess && (
        <Alert variant="success">
          Operación guardada. Las pruebas se agregan a la cola; la entrega se
          confirma en el historial.
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <form
          className={seccion}
          onSubmit={(e) => {
            e.preventDefault()
            w.accion.mutate(() =>
              whatsappApi.registrar({
                telefono_e164: `${codigoPais}${telefono.replace(/\D/g, '')}`,
                ...(contactoId ? { contacto_emergencia_id: contactoId } : {}),
              }),
            )
          }}
        >
          <h2 className="text-lg font-semibold text-pino-900">Registrar destinatario</h2>
          <p className="text-sm leading-6 text-salvia-700">
            Elige el país y escribe el número sin el código; se guarda en formato
            internacional (por ejemplo +52 55 1234 5678) y debe coincidir con el
            del perfil. El registro queda pendiente de consentimiento.
          </p>
          {admin && (
            <label className={campo}>
              Titular
              <Select
                value={contactoId}
                onChange={(e) => {
                  setContactoId(e.target.value)
                  const elegido = partirTelefono(
                    contactos.data?.find((c) => c.id === e.target.value)
                      ?.telefono ?? usuario?.telefono,
                  )
                  setCodigoPais(elegido.codigo)
                  setTelefono(elegido.local)
                }}
              >
                <option value="">Mi cuenta</option>
                {contactos.data
                  ?.filter((c) => c.activo)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} · {c.telefono}
                    </option>
                  ))}
              </Select>
            </label>
          )}
          {admin && contactos.isError && (
            <Alert>No se pudieron cargar los contactos de emergencia.</Alert>
          )}
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
              <label className={campo} htmlFor="whatsapp-codigo-pais">
                País y código
                <Select
                  id="whatsapp-codigo-pais"
                  value={codigoPais}
                  onChange={(e) => setCodigoPais(e.target.value)}
                >
                  {PAISES_TELEFONO.map((pais) => (
                    <option key={pais.codigo} value={pais.codigo}>
                      {pais.nombre} ({pais.codigo})
                    </option>
                  ))}
                </Select>
              </label>
              <label className={campo} htmlFor="whatsapp-telefono">
                Número de teléfono
                <Input
                  id="whatsapp-telefono"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="55 1234 5678"
                  required
                  maxLength={14}
                  aria-describedby="whatsapp-telefono-ayuda"
                />
              </label>
            </div>
            <p id="whatsapp-telefono-ayuda" className="break-words text-xs leading-5 text-salvia-600">
              Se registrará como {codigoPais}
              {telefono.replace(/\D/g, '') || '…'}.
            </p>
          </div>
          <Button type="submit" disabled={w.accion.isPending} className="w-full sm:w-auto">
            {w.accion.isPending ? 'Guardando…' : 'Registrar destinatario'}
          </Button>
        </form>

        <div id="destinatarios" className={seccion}>
          <h2 className="text-lg font-semibold text-pino-900">
            Destinatarios y consentimiento
          </h2>
          <p className="text-sm leading-6 text-salvia-700">Cada titular debe aceptar recibir avisos antes de que se le puedan enviar mensajes.</p>
          {w.destinatarios.isPending ? (
            <p role="status" className={estadoVacio}>Cargando destinatarios…</p>
          ) : w.destinatarios.isError ? (
            <Alert>No se pudieron cargar los destinatarios.</Alert>
          ) : w.destinatarios.data?.length === 0 ? (
            <p className={estadoVacio}>Aún no hay destinatarios. Registra un número de teléfono para gestionar su consentimiento.</p>
          ) : (
            w.destinatarios.data?.map((d) => (
              <Consentimiento
                key={d.id}
                d={d}
                propio={d.usuario_id === usuario?.id}
                admin={admin}
                ocupado={w.accion.isPending}
                pruebaHabilitada={Boolean(configurada)}
                ejecutar={w.accion.mutate}
              />
            ))
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div id="preferencias" className={seccion}>
          <h2 className="text-lg font-semibold text-pino-900">
            Preferencias del adulto mayor
          </h2>
          <p className="text-sm leading-6 text-salvia-700">Selecciona a la persona para ajustar sus avisos y recordatorios.</p>
          <label className={campo}>
            Adulto mayor
            <Select
              value={adultoId}
              onChange={(e) => setAdultoId(e.target.value)}
              disabled={adultos.isPending && usuario?.rol.codigo !== 'ADULTO_MAYOR'}
            >
              <option value="">{adultos.isPending && usuario?.rol.codigo !== 'ADULTO_MAYOR' ? 'Cargando adultos…' : 'Selecciona un adulto mayor'}</option>
              {opcionesAdultos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} {a.apellido}
                </option>
              ))}
            </Select>
          </label>
          {adultos.isError && usuario?.rol.codigo !== 'ADULTO_MAYOR' && (
            <Alert>No se pudieron cargar los adultos vinculados.</Alert>
          )}
          {adultoId && <PreferenciasAdulto key={adultoId} id={adultoId} />}
          {!adultoId && !adultos.isPending && !adultos.isError && opcionesAdultos.length === 0 && (
            <p className={estadoVacio}>No hay adultos mayores disponibles para configurar.</p>
          )}
        </div>

        <div className={seccion}>
          <h2 className="text-lg font-semibold text-pino-900">
            Envíos por alerta
          </h2>
          <p className="text-sm text-salvia-700">
            Conteo de mensajes por alerta y estado del proveedor.
          </p>
          {resumen.isPending ? (
            <p role="status" className={estadoVacio}>Cargando resumen…</p>
          ) : resumen.isError ? (
            <Alert>No se pudo cargar el resumen de envíos.</Alert>
          ) : resumen.data?.length === 0 ? (
            <p className={estadoVacio}>Sin envíos asociados a alertas. Aquí podrás revisar sus estados cuando se registren.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {Object.entries(
                (resumen.data ?? []).reduce<Record<string, string[]>>(
                  (acc, f) => {
                    acc[f.alerta_id] = [
                      ...(acc[f.alerta_id] ?? []),
                      `${etiquetaWhatsapp(f.estado)}: ${f.cantidad}`,
                    ]
                    return acc
                  },
                  {},
                ),
              ).map(([alertaId, partes]) => (
                <li key={alertaId} className="space-y-2 rounded-lg border border-salvia-200 p-4">
                  <span className="block break-all text-xs text-salvia-700">
                    Alerta: {alertaId}
                  </span>
                  <div className="flex flex-wrap gap-2">{partes.map((parte) => <span key={parte} className="rounded-md bg-pino-50 px-2.5 py-1 text-pino-800">{parte}</span>)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div id="historial" className={seccion}>
        <h2 className="text-lg font-semibold text-pino-900">Historial de mensajes</h2>
        <p className="text-sm leading-6 text-salvia-700">
          Últimos 100 mensajes. La aceptación por Meta, la entrega y la lectura
          son estados distintos.
        </p>
        <div className={BARRA_FILTROS}>
          <label className={campo}>
            Buscar mensaje
            <Input type="search" placeholder="Nombre, teléfono o tipo…" value={busquedaHistorial} onChange={(e) => setBusquedaHistorial(e.target.value)} />
          </label>
          <label className={campo}>
            Estado del mensaje
            <Select value={estadoHistorial} onChange={(e) => setEstadoHistorial(e.target.value)}>
              <option value="">Todos los estados</option>
              {estadosHistorial.map((estado) => (
                <option key={estado} value={estado}>{etiquetaWhatsapp(estado)}</option>
              ))}
            </Select>
          </label>
          {(busquedaHistorial || estadoHistorial) && (
            <div className="col-span-full flex justify-end">
              <Button variant="secondary" onClick={() => {
                setBusquedaHistorial('')
                setEstadoHistorial('')
              }}>
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>
        {w.historial.isPending ? (
          <p role="status" className={estadoVacio}>Cargando historial…</p>
        ) : w.historial.isError ? (
          <Alert>No se pudo cargar el historial.</Alert>
        ) : w.historial.data?.length === 0 ? (
          <p className={estadoVacio}>Sin mensajes registrados. Los envíos y sus confirmaciones aparecerán aquí.</p>
        ) : mensajesVisibles.length === 0 ? (
          <p role="status" className={estadoVacio}>No hay mensajes que coincidan. Ajusta o limpia los filtros para ver más resultados.</p>
        ) : (
          <div className="space-y-3">
            <p role="status" className="text-sm text-salvia-600">Mostrando {mensajesVisibles.length} de {w.historial.data?.length ?? 0} mensajes cargados.</p>
            {mensajesVisibles.map((n) => (
              <details
                key={n.id}
                className="group rounded-lg border border-salvia-200 text-sm open:border-pino-300"
              >
                <summary className="min-h-11 cursor-pointer rounded-lg p-4 hover:bg-salvia-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600">
                  <span className="ml-1 inline-flex max-w-full flex-wrap items-center gap-x-4 gap-y-2 align-middle">
                    <span className="min-w-0 break-words font-medium text-pino-900">{destinoNombre.get(n.destinatario_id) ?? 'Destinatario'}</span>
                    <span className="text-salvia-600">{formatFechaHora(n.created_at)}</span>
                    <span className="text-salvia-700">{n.tipo}</span>
                    <EstadoWhatsapp estado={n.estado} />
                  </span>
                </summary>
                <div className="space-y-3 break-words border-t border-salvia-200 bg-salvia-50 p-4 text-salvia-700">
                  <p>
                    Intentos: {n.intentos}
                    {n.codigo_error ? ` · Código: ${n.codigo_error}` : ''}
                  </p>
                  {n.siguiente_intento_en && (
                    <p>
                      Próximo intento: {formatFechaHora(n.siguiente_intento_en)}
                    </p>
                  )}
                  {n.eventos.length ? (
                    n.eventos.map((e) => (
                      <p key={e.id}>
                        {formatFechaHora(e.ocurrido_en)} ·{' '}
                        {etiquetaWhatsapp(e.estado)}
                        {e.codigo_error ? ` (${e.codigo_error})` : ''}
                      </p>
                    ))
                  ) : (
                    <p>Sin confirmaciones del proveedor.</p>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function EstadoWhatsapp({ estado }: { estado: string }) {
  const tono = estado === 'FALLIDA'
    ? 'bg-red-50 text-red-800 ring-red-200'
    : estado === 'ENTREGADA' || estado === 'LEIDA'
      ? 'bg-pino-50 text-pino-800 ring-pino-200'
      : 'bg-salvia-100 text-salvia-800 ring-salvia-200'
  return <span className={`inline-flex max-w-full rounded-md px-2.5 py-1 text-xs font-semibold leading-5 ring-1 ring-inset ${tono}`}>{etiquetaWhatsapp(estado)}</span>
}

function Consentimiento({
  d,
  propio,
  admin,
  ocupado,
  pruebaHabilitada,
  ejecutar,
}: {
  d: Destinatario
  propio: boolean
  admin: boolean
  ocupado: boolean
  pruebaHabilitada: boolean
  ejecutar: (fn: () => Promise<unknown>) => void
}) {
  const [confirmado, setConfirmado] = useState(false)
  const [origen, setOrigen] = useState<'FORMULARIO' | 'OTRO'>('FORMULARIO')
  const puedeAceptar = propio || (admin && Boolean(d.contacto_emergencia_id))
  const consentimiento = {
    PENDIENTE: 'Consentimiento pendiente',
    ACEPTADO: 'Consentimiento aceptado',
    REVOCADO: 'Consentimiento revocado',
  }[d.consentimiento]
  return (
    <div className="space-y-4 rounded-lg border border-salvia-200 p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="break-words font-semibold text-pino-900">{d.nombre ?? 'Destinatario'}</p>
          <p className="break-all text-salvia-700">{d.telefono_e164}</p>
        </div>
        <span className={`max-w-full rounded-md px-2.5 py-1 text-xs font-semibold leading-5 ${d.consentimiento === 'ACEPTADO' ? 'bg-pino-50 text-pino-800' : 'bg-salvia-100 text-salvia-800'}`}>{consentimiento}</span>
      </div>
      {!d.activo && <p className="text-salvia-700">Este destinatario está inactivo.</p>}
      {d.consentimiento_en && (
        <p className="text-xs leading-5 text-salvia-600">
          Consentimiento: {formatFechaHora(d.consentimiento_en)} ·{' '}
          {d.consentimiento_origen}
        </p>
      )}
      {d.revocado_en && <p>Revocado: {formatFechaHora(d.revocado_en)}</p>}
      {puedeAceptar && d.consentimiento !== 'ACEPTADO' && (
        <>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg bg-salvia-50 p-3 leading-6 text-salvia-800">
            <input
              type="checkbox"
              className={casilla}
              checked={confirmado}
              disabled={ocupado}
              onChange={(e) => setConfirmado(e.target.checked)}
            />
            {propio
              ? 'Soy titular de este número y acepto recibir las notificaciones de RIBANI por WhatsApp. Puedo revocar mi consentimiento aquí.'
              : 'He verificado y conservado evidencia del consentimiento del titular de este contacto para recibir notificaciones de RIBANI.'}
          </label>
          {!propio && (
            <label className={campo}>
              Origen de la evidencia
              <Select
                value={origen}
                onChange={(e) => setOrigen(e.target.value as typeof origen)}
                disabled={ocupado}
              >
                <option value="FORMULARIO">Formulario</option>
                <option value="OTRO">Otro medio documentado</option>
              </Select>
            </label>
          )}
        </>
      )}
      <div className="flex flex-wrap gap-3 [&>button]:w-full sm:[&>button]:w-auto">
        {puedeAceptar && d.consentimiento !== 'ACEPTADO' && (
          <Button
            size="sm"
            disabled={!confirmado || ocupado}
            onClick={() =>
              ejecutar(() =>
                whatsappApi.consentimiento(d.id, {
                  aceptado: true,
                  ...(!propio ? { origen } : {}),
                }),
              )
            }
          >
            Aceptar consentimiento
          </Button>
        )}
        {d.consentimiento === 'ACEPTADO' && (propio || admin) && (
          <Button
            size="sm"
            variant="danger"
            disabled={ocupado}
            onClick={() =>
              ejecutar(() =>
                whatsappApi.consentimiento(d.id, { aceptado: false }),
              )
            }
          >
            Revocar consentimiento
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          disabled={
            ocupado ||
            !pruebaHabilitada ||
            !d.activo ||
            d.consentimiento !== 'ACEPTADO'
          }
          onClick={() => ejecutar(() => whatsappApi.prueba(d.id))}
        >
          Enviar mensaje de prueba
        </Button>
      </div>
      {(!pruebaHabilitada || !d.activo || d.consentimiento !== 'ACEPTADO') && (
        <p className="text-xs leading-5 text-salvia-600">
          {!pruebaHabilitada
            ? 'Las pruebas estarán disponibles cuando WhatsApp esté habilitado.'
            : !d.activo
              ? 'Las pruebas requieren un destinatario activo.'
              : 'Acepta el consentimiento para habilitar el mensaje de prueba.'}
        </p>
      )}
    </div>
  )
}

function PreferenciasAdulto({ id }: { id: string }) {
  const p = usePreferenciasWhatsapp(id)
  const usuario = useAuthStore((s) => s.usuario)
  const controlGeneral =
    usuario?.id === id || usuario?.rol.codigo === 'ADMINISTRADOR'
  return (
    <div className="space-y-3">
      {p.consulta.isPending ? (
        <p role="status" className={estadoVacio}>Cargando preferencias…</p>
      ) : p.consulta.isError ? (
        <Alert>{mensajeError(p.consulta.error)}</Alert>
      ) : (
        <FormularioPreferencias
          key={JSON.stringify(p.consulta.data)}
          datos={p.consulta.data}
          ocupado={p.guardar.isPending}
          controlGeneral={controlGeneral}
          guardar={p.guardar.mutate}
        />
      )}
      {p.guardar.isError && <Alert>{mensajeError(p.guardar.error)}</Alert>}
      {p.guardar.isSuccess && (
        <Alert variant="success">Preferencias guardadas.</Alert>
      )}
    </div>
  )
}
function FormularioPreferencias({
  datos,
  ocupado,
  guardar,
  controlGeneral,
}: {
  datos: Preferencias
  ocupado: boolean
  guardar: (datos: PreferenciasEntrada) => void
  controlGeneral: boolean
}) {
  const [form, setForm] = useState<PreferenciasEntrada>({
    notificaciones_habilitadas: datos.notificaciones_habilitadas,
    recordatorio_medicamentos: datos.recordatorio_medicamentos,
    minutos_repeticion: datos.minutos_repeticion,
    max_repeticiones: datos.max_repeticiones,
  })
  return (
    <form
      className="space-y-4 border-t border-salvia-200 pt-5 text-sm"
      onSubmit={(e) => {
        e.preventDefault()
        guardar(form)
      }}
    >
      <label className="flex min-h-11 items-start gap-3 rounded-lg border border-salvia-200 bg-salvia-50 p-3 leading-6">
        <input
          type="checkbox"
          className={casilla}
          checked={form.notificaciones_habilitadas}
          disabled={!controlGeneral || ocupado}
          onChange={(e) =>
            setForm({ ...form, notificaciones_habilitadas: e.target.checked })
          }
        />
        Permitir notificaciones por WhatsApp
      </label>
      {!controlGeneral && <p className="text-xs leading-5 text-salvia-600">El adulto mayor o un administrador puede cambiar el permiso general de notificaciones.</p>}
      <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-salvia-200 bg-salvia-50 p-3 leading-6">
        <input
          type="checkbox"
          className={casilla}
          disabled={ocupado}
          checked={form.recordatorio_medicamentos}
          onChange={(e) =>
            setForm({ ...form, recordatorio_medicamentos: e.target.checked })
          }
        />
        Recordar medicamentos al adulto en su número con consentimiento
      </label>
      <div className="grid items-start gap-4 sm:grid-cols-2">
        <label className={campo}>
          Intervalo (minutos)
          <Input
            type="number"
            min={1}
            max={120}
            required
            disabled={ocupado}
            value={form.minutos_repeticion}
            onChange={(e) =>
              setForm({ ...form, minutos_repeticion: Number(e.target.value) })
            }
          />
          <span className="block text-xs font-normal leading-5 text-salvia-600">De 1 a 120 minutos.</span>
        </label>
        <label className={campo}>
          Repeticiones adicionales
          <Input
            type="number"
            min={0}
            max={12}
            required
            disabled={ocupado}
            value={form.max_repeticiones}
            onChange={(e) =>
              setForm({ ...form, max_repeticiones: Number(e.target.value) })
            }
          />
          <span className="block text-xs font-normal leading-5 text-salvia-600">De 0 a 12, después del aviso inicial.</span>
        </label>
      </div>
      <p className="leading-6 text-salvia-700">
        Las preferencias se aplican cuando la integración está habilitada. Una
        toma registrada detiene los próximos recordatorios.
      </p>
      <Button type="submit" disabled={ocupado} className="w-full sm:w-auto">
        {ocupado ? 'Guardando…' : 'Guardar preferencias'}
      </Button>
    </form>
  )
}
