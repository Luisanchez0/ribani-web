import { useState } from 'react'

import { DosPasosModal } from '@/features/auth'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IconoAjustes, IconoEscudo, IconoLapiz } from '@/lib/iconos'
import { useAuthStore } from '@/stores/auth-store'

import { ModalCambiarPassword } from '../components/modal-cambiar-password'
import { ModalEditarPerfil } from '../components/modal-editar-perfil'

/* Botón de lápiz reutilizable para abrir los modales de edición. */
function BotonLapiz({
  etiqueta,
  onClick,
}: {
  etiqueta: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      title={etiqueta}
      className="shrink-0 rounded-md p-1.5 text-pino-600 transition-colors hover:bg-salvia-100 hover:text-pino-800"
      onClick={onClick}
    >
      <IconoLapiz size={16} />
    </button>
  )
}

/**
 * Configuración de la cuenta (/panel/config), disponible para
 * ADMINISTRADOR y FAMILIAR_ENCARGADO. Secciones:
 *
 *  - Perfil: datos personales de la sesión en lectura; el LÁPIZ abre
 *    el modal de edición (PATCH /usuarios/perfil: nombre, apellido y
 *    teléfono).
 *  - Cuenta: estado de la cuenta (lectura).
 *  - Acceso: email (lectura), CONTRASEÑA con lápiz que abre el modal
 *    de cambio propio (PATCH /usuarios/perfil/password, pide la
 *    contraseña actual) y Autenticación (2FA con el DosPasosModal de
 *    la feature auth).

 */
export function ConfigPage() {
  const usuario = useAuthStore((state) => state.usuario)
  const habilitadoDosPasos = usuario?.twoFactorEnabled ?? false

  const [modalPerfilAbierto, setModalPerfilAbierto] = useState(false)
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false)
  const [modalDosPasosAbierto, setModalDosPasosAbierto] = useState(false)
  const [exitoDosPasos, setExitoDosPasos] = useState<string | null>(null)

  return (
    <section className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-pino-900">
          <IconoAjustes size={24} className="text-pino-600" />
          Configuración
        </h1>
        <p className="mt-1 max-w-2xl text-sm/6 text-salvia-700">
          Tu perfil, información de la cuenta y opciones de acceso.
        </p>
      </div>

      {exitoDosPasos && <Alert variant="success">{exitoDosPasos}</Alert>}

      {/* ── Perfil ─────────────────────────────────────────────────── */}
      <Seccion
        titulo="Perfil"
        legenda="Datos de la persona que usa esta cuenta."
        accion={
          <BotonLapiz
            etiqueta="Editar perfil"
            onClick={() => setModalPerfilAbierto(true)}
          />
        }
      >
        <CamposLectura
          registros={[
            ['Nombre', usuario?.nombre],
            ['Apellido', usuario?.apellido],
            ['Teléfono', usuario?.telefono ?? 'Sin teléfono registrado'],
            [
              'Correo verificado',
              usuario?.emailVerificado
                ? 'Verificado'
                : 'Pendiente de verificación',
            ],
          ]}
        />
      </Seccion>

      {/* ── Cuenta ─────────────────────────────────────────────────── */}
      <Seccion titulo="Cuenta" legenda="Estado general de tu cuenta en RIBANI.">
        <CamposLectura
          registros={[
            ['Estado', 'Activo'],
            ['Rol', usuario?.rol.nombre],
            ['Email de inicio de sesión', usuario?.email],
          ]}
        />
      </Seccion>

      {/* ── Acceso ────────────────────────────────────────────────── */}
      <Seccion
        titulo="Acceso"
        legenda="Credenciales y autenticación de tu cuenta."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="config-email"
              className="block text-sm font-medium text-pino-900"
            >
              Correo electrónico
            </label>
            <Input id="config-email" value={usuario?.email ?? ''} readOnly />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="config-password"
                className="block text-sm font-medium text-pino-900"
              >
                Contraseña
              </label>
              <BotonLapiz
                etiqueta="Cambiar contraseña"
                onClick={() => setModalPasswordAbierto(true)}
              />
            </div>
            <Input
              id="config-password"
              type="password"
              value="password-ficticio-no-mostrar"
              readOnly
              tabIndex={-1}
              aria-describedby="config-password-nota"
            />
            <p id="config-password-nota" className="text-xs text-salvia-600">
              Por seguridad no se muestra; cámbiala con el lápiz (te pide tu
              contraseña actual para autorizar el cambio).
            </p>
          </div>

          {/* Autenticación: verificación en dos pasos (2FA). */}
          <div className="rounded-md border border-salvia-200 bg-salvia-50 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-pino-900">
              <IconoEscudo size={16} className="text-pino-600" />
              Autenticación · Verificación en dos pasos
            </h3>
            <p className="mt-1 text-sm/6 text-salvia-700">
              Estado:{' '}
              {habilitadoDosPasos ? (
                <span className="font-medium text-pino-700">activado</span>
              ) : (
                <span className="font-medium text-amber-700">desactivado</span>
              )}
              {habilitadoDosPasos
                ? ' · tu cuenta pide un código extra al iniciar sesión.'
                : ' · añade un código de tu app authenticator al iniciar sesión.'}
            </p>

            {!habilitadoDosPasos && (
              <Button
                className="mt-3"
                onClick={() => {
                  setExitoDosPasos(null)
                  setModalDosPasosAbierto(true)
                }}
              >
                Configurar 2FA
              </Button>
            )}
          </div>
        </div>
      </Seccion>

      {/* Modales de edición de perfil y de contraseña. */}
      <ModalEditarPerfil
        abierto={modalPerfilAbierto}
        onCerrar={() => setModalPerfilAbierto(false)}
      />
      <ModalCambiarPassword
        abierto={modalPasswordAbierto}
        onCerrar={() => setModalPasswordAbierto(false)}
      />

      {/* Modal de 2FA a pantalla completa (2 pasos: QR → código). */}
      <DosPasosModal
        abierto={modalDosPasosAbierto}
        onCerrar={() => {
          setModalDosPasosAbierto(false)
          setExitoDosPasos('¡Listo! El 2FA quedó activado en tu cuenta.')
        }}
      />
    </section>
  )
}

/** Contenedor con título, leyenda y acción opcional (lápiz) de una sección. */
function Seccion({
  titulo,
  legenda,
  accion,
  children,
}: {
  titulo: string
  legenda: string
  accion?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-salvia-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-salvia-100 px-4 py-3">
        <div>
          <h2 className="font-display text-base font-semibold text-pino-900">
            {titulo}
          </h2>
          <p className="mt-0.5 text-xs text-salvia-600">{legenda}</p>
        </div>
        {accion}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

/** Lista clave–valor (etiqueta, valor o '—' si es null/undefined). */
function CamposLectura({
  registros,
}: {
  registros: Array<[string, string | undefined | null]>
}) {
  return (
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {registros.map(([etiqueta, valor]) => (
        <div key={etiqueta}>
          <dt className="text-xs font-medium text-salvia-600">{etiqueta}</dt>
          <dd className="mt-0.5 text-sm font-medium text-pino-900">
            {valor ?? '—'}
          </dd>
        </div>
      ))}
    </dl>
  )
}
