import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { contactosApi } from '@/features/contactos'
import { useAdultos } from '@/features/usuarios'
import { useMisAdultos } from '@/features/familiares'
import { formatFechaHora } from '@/lib/format'
import { useAuthStore } from '@/stores/auth-store'
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
import { etiquetaWhatsapp } from '../utils/estados'

const seccion = 'space-y-4'
const campo = 'rounded-md border border-salvia-300 bg-white px-3 py-2 text-sm'

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
  const [telefono, setTelefono] = useState(usuario?.telefono ?? '')
  const [contactoId, setContactoId] = useState('')
  const [adultoId, setAdultoId] = useState('')
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

  return (
    <section className="space-y-8">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-semibold text-pino-900">
          Notificaciones por WhatsApp
        </h1>
        <p className="text-sm text-salvia-700">
          Gestiona tu consentimiento y revisa el estado de tus mensajes.
        </p>
      </div>
      {w.integracion.isError ? (
        <Alert>No se pudo consultar la integración.</Alert>
      ) : w.integracion.isPending ? (
        <p>Cargando integración…</p>
      ) : !configurada ? (
        <Alert>
          Los envíos de prueba están deshabilitados. Puedes registrar
          destinatarios y administrar el consentimiento mientras se configura la
          integración.
        </Alert>
      ) : (
        <Alert variant="success">
          La integración y el procesador están habilitados.
        </Alert>
      )}
      {w.accion.isError && <Alert>{mensajeError(w.accion.error)}</Alert>}
      {w.accion.isSuccess && (
        <Alert variant="success">
          Operación guardada. Las pruebas se agregan a la cola; la entrega se
          confirma en el historial.
        </Alert>
      )}

      <form
        className={seccion}
        onSubmit={(e) => {
          e.preventDefault()
          w.accion.mutate(() =>
            whatsappApi.registrar({
              telefono_e164: telefono,
              ...(contactoId ? { contacto_emergencia_id: contactoId } : {}),
            }),
          )
        }}
      >
        <h2 className="font-semibold text-pino-900">Registrar destinatario</h2>
        <p className="text-sm text-salvia-700">
          Tu número debe coincidir con el de tu perfil, con prefijo
          internacional (por ejemplo +525512345678). El registro queda pendiente
          de consentimiento.
        </p>
        {admin && (
          <label className="block space-y-1 text-sm">
            Titular
            <select
              className={campo}
              value={contactoId}
              onChange={(e) => {
                setContactoId(e.target.value)
                setTelefono(
                  contactos.data?.find((c) => c.id === e.target.value)
                    ?.telefono ??
                    usuario?.telefono ??
                    '',
                )
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
            </select>
          </label>
        )}
        {admin && contactos.isError && (
          <Alert>No se pudieron cargar los contactos de emergencia.</Alert>
        )}
        <label className="block space-y-1 text-sm">
          Teléfono internacional
          <Input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            type="tel"
            pattern="\+[1-9][0-9]{7,14}"
            required
            maxLength={16}
          />
        </label>
        <Button type="submit" disabled={w.accion.isPending}>
          Registrar pendiente
        </Button>
      </form>

      <div className={seccion}>
        <h2 className="font-semibold text-pino-900">
          Destinatarios y consentimiento
        </h2>
        {w.destinatarios.isPending ? (
          <p>Cargando destinatarios…</p>
        ) : w.destinatarios.isError ? (
          <Alert>No se pudieron cargar los destinatarios.</Alert>
        ) : w.destinatarios.data?.length === 0 ? (
          <p className="text-sm">Aún no hay destinatarios registrados.</p>
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

      <div className={seccion}>
        <h2 className="font-semibold text-pino-900">
          Preferencias del adulto mayor
        </h2>
        <label className="block text-sm">
          Adulto mayor
          <select
            className={campo}
            value={adultoId}
            onChange={(e) => setAdultoId(e.target.value)}
          >
            <option value="">Seleccionar</option>
            {opcionesAdultos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre} {a.apellido}
              </option>
            ))}
          </select>
        </label>
        {adultos.isError && usuario?.rol.codigo !== 'ADULTO_MAYOR' && (
          <Alert>No se pudieron cargar los adultos vinculados.</Alert>
        )}
        {adultoId && <PreferenciasAdulto key={adultoId} id={adultoId} />}
      </div>

      <div className={seccion}>
        <h2 className="font-semibold text-pino-900">
          Envíos por alerta
        </h2>
        <p className="text-sm text-salvia-700">
          Conteo de mensajes por alerta y estado del proveedor.
        </p>
        {resumen.isPending ? (
          <p>Cargando resumen…</p>
        ) : resumen.isError ? (
          <Alert>No se pudo cargar el resumen de envíos.</Alert>
        ) : resumen.data?.length === 0 ? (
          <p className="text-sm">Sin envíos asociados a alertas.</p>
        ) : (
          <ul className="space-y-1 text-sm">
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
              <li key={alertaId} className="flex flex-wrap gap-2">
                <span className="font-mono text-xs text-salvia-700">
                  {alertaId.slice(0, 8)}
                </span>
                <span>{partes.join(' · ')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={seccion}>
        <h2 className="font-semibold text-pino-900">Historial de mensajes</h2>
        <p className="text-sm text-salvia-700">
          Últimos 100 mensajes. La aceptación por Meta, la entrega y la lectura
          son estados distintos.
        </p>
        {w.historial.isPending ? (
          <p>Cargando historial…</p>
        ) : w.historial.isError ? (
          <Alert>No se pudo cargar el historial.</Alert>
        ) : w.historial.data?.length === 0 ? (
          <p className="text-sm">Sin mensajes registrados.</p>
        ) : (
          w.historial.data?.map((n) => (
            <details
              key={n.id}
              className="border-b border-salvia-200 py-3 text-sm last:border-b-0"
            >
              <summary className="cursor-pointer">
                {formatFechaHora(n.created_at)} ·{' '}
                {destinoNombre.get(n.destinatario_id) ?? 'Destinatario'} ·{' '}
                {n.tipo} · <strong>{etiquetaWhatsapp(n.estado)}</strong>
              </summary>
              <div className="mt-3 space-y-2">
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
          ))
        )}
      </div>
    </section>
  )
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
  return (
    <div className="space-y-3 border-t border-salvia-200 pt-4 text-sm">
      <p>
        <strong>{d.nombre ?? 'Destinatario'}</strong> · {d.telefono_e164} ·{' '}
        {d.consentimiento}
      </p>
      {d.consentimiento_en && (
        <p>
          Consentimiento: {formatFechaHora(d.consentimiento_en)} ·{' '}
          {d.consentimiento_origen}
        </p>
      )}
      {d.revocado_en && <p>Revocado: {formatFechaHora(d.revocado_en)}</p>}
      {puedeAceptar && d.consentimiento !== 'ACEPTADO' && (
        <>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={confirmado}
              onChange={(e) => setConfirmado(e.target.checked)}
            />
            {propio
              ? 'Soy titular de este número y acepto recibir las notificaciones de RIBANI por WhatsApp. Puedo revocar mi consentimiento aquí.'
              : 'He verificado y conservado evidencia del consentimiento del titular de este contacto para recibir notificaciones de RIBANI.'}
          </label>
          {!propio && (
            <label>
              Origen de la evidencia
              <select
                className={campo}
                value={origen}
                onChange={(e) => setOrigen(e.target.value as typeof origen)}
              >
                <option value="FORMULARIO">Formulario</option>
                <option value="OTRO">Otro medio documentado</option>
              </select>
            </label>
          )}
        </>
      )}
      <div className="flex flex-wrap gap-2">
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
          Encolar prueba
        </Button>
      </div>
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
        <p>Cargando preferencias…</p>
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
      className="space-y-3 text-sm"
      onSubmit={(e) => {
        e.preventDefault()
        guardar(form)
      }}
    >
      <label className="flex gap-2">
        <input
          type="checkbox"
          checked={form.notificaciones_habilitadas}
          disabled={!controlGeneral}
          onChange={(e) =>
            setForm({ ...form, notificaciones_habilitadas: e.target.checked })
          }
        />
        Permitir notificaciones por WhatsApp
      </label>
      <label className="flex gap-2">
        <input
          type="checkbox"
          checked={form.recordatorio_medicamentos}
          onChange={(e) =>
            setForm({ ...form, recordatorio_medicamentos: e.target.checked })
          }
        />
        Recordar medicamentos al adulto en su número con consentimiento
      </label>
      <label className="block">
        Minutos entre repeticiones
        <Input
          type="number"
          min={1}
          max={120}
          required
          value={form.minutos_repeticion}
          onChange={(e) =>
            setForm({ ...form, minutos_repeticion: Number(e.target.value) })
          }
        />
      </label>
      <label className="block">
        Repeticiones después del aviso inicial
        <Input
          type="number"
          min={0}
          max={12}
          required
          value={form.max_repeticiones}
          onChange={(e) =>
            setForm({ ...form, max_repeticiones: Number(e.target.value) })
          }
        />
      </label>
      <p className="text-salvia-700">
        Las preferencias se aplican cuando la integración está habilitada. Una
        toma registrada detiene los próximos recordatorios.
      </p>
      <Button type="submit" disabled={ocupado}>
        Guardar preferencias
      </Button>
    </form>
  )
}
