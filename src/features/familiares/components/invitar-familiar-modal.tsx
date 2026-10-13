import { useState } from 'react'
import type { FormEvent } from 'react'

import { ROL_ADMINISTRADOR } from '@/app/guards/require-role'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useUsuarios } from '@/features/usuarios'
import { ROL_FAMILIAR_ENCARGADO } from '@/features/auth/types'
import { useAuthStore } from '@/stores/auth-store'
import { useInvitarFamiliar } from '../hooks'

type InvitarFamiliarModalProps = {
  abierto: boolean
  onCerrar: () => void
}


export function InvitarFamiliarModal({
  abierto,
  onCerrar,
}: InvitarFamiliarModalProps) {
  const invitar = useInvitarFamiliar()

  const esAdmin =
    useAuthStore((state) => state.usuario)?.rol.codigo ===
    ROL_ADMINISTRADOR
  const usuarios = useUsuarios(esAdmin ? { rol: ROL_FAMILIAR_ENCARGADO } : undefined)

  const [cuidadorId, setCuidadorId] = useState('')
  const [adultoEmail, setAdultoEmail] = useState('')
  const [adultoNombre, setAdultoNombre] = useState('')
  const [adultoApellido, setAdultoApellido] = useState('')
  const [adultoTelefono, setAdultoTelefono] = useState('')
  const [parentesco, setParentesco] = useState('')
  const [puedeVerUbicacion, setPuedeVerUbicacion] = useState(true)
  const [puedeGestionar, setPuedeGestionar] = useState(false)

  if (!abierto) return null

  function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    invitar.mutate(
      {
        // Solo el admin marca explícitamente quién cuidará al adulto;
        // el familiar encargado lo resuelve el backend con su JWT.
        ...(esAdmin ? { familiar_id: cuidadorId } : {}),
        adulto_email: adultoEmail.trim(),
        adulto_nombre: adultoNombre.trim() || undefined,
        adulto_apellido: adultoApellido.trim() || undefined,
        adulto_telefono: adultoTelefono.trim() || undefined,
        parentesco: parentesco.trim() || undefined,
        puede_ver_ubicacion: puedeVerUbicacion,
        puede_gestionar_medicamentos: puedeGestionar,
      },
      { onSuccess: onCerrar },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar formulario"
        className="absolute inset-0 cursor-default bg-pino-950/60"
        onClick={onCerrar}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-invitacion-modal"
        className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-lg border border-salvia-200 bg-white p-6 shadow-lg"
      >
        <h2
          id="titulo-invitacion-modal"
          className="font-display text-lg font-semibold text-pino-900"
        >
          Invitar a un familiar
        </h2>
        <p className="mt-1 text-sm/6 text-salvia-700">
          {esAdmin
            ? 'Como administrador, indica el cuidador y el adulto a vincular.'
            : 'Enviará una invitación para que un familiar pueda hacer seguimiento del adulto mayor.'}
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {esAdmin && (
            <div className="space-y-1.5">
              <label
                htmlFor="invitacion-cuidador"
                className="block text-sm font-medium text-pino-900"
              >
                Cuidador (usuario familiar)
              </label>
              {usuarios.isPending ? (
                <div className="flex items-center gap-3 py-2 text-sm text-salvia-600">
                  <Spinner size="sm" label="Cargando usuarios" />
                  Cargando usuarios…
                </div>
              ) : usuarios.isError ? (
                <Alert variant="error">
                  No se pudo cargar la lista de usuarios familiares.
                </Alert>
              ) : (
                <select
                  id="invitacion-cuidador"
                  required
                  className="w-full rounded-md border border-salvia-300 bg-white px-3 py-2 text-sm text-pino-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600"
                  value={cuidadorId}
                  onChange={(evento) => setCuidadorId(evento.target.value)}
                >
                  <option value="" disabled>
                    Selecciona un usuario familiar
                  </option>
                  {usuarios.data.map((usuario) => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nombre} {usuario.apellido} ({usuario.email})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="invitacion-adulto-email"
              className="block text-sm font-medium text-pino-900"
            >
              Correo del adulto
            </label>
            <Input
              id="invitacion-adulto-email"
              type="email"
              required
              autoComplete="off"
              value={adultoEmail}
              onChange={(evento) => setAdultoEmail(evento.target.value)}
            />
            <p className="text-xs text-salvia-600">
              Si no existe esa cuenta, se creará inactiva y la invitación
              quedará registrada de inmediato.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="invitacion-adulto-nombre"
                className="block text-sm font-medium text-pino-900"
              >
                Nombre del adulto{' '}
                <span className="text-salvia-500">(opcional)</span>
              </label>
              <Input
                id="invitacion-adulto-nombre"
                value={adultoNombre}
                onChange={(evento) => setAdultoNombre(evento.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="invitacion-adulto-apellido"
                className="block text-sm font-medium text-pino-900"
              >
                Apellido <span className="text-salvia-500">(opcional)</span>
              </label>
              <Input
                id="invitacion-adulto-apellido"
                value={adultoApellido}
                onChange={(evento) => setAdultoApellido(evento.target.value)}
              />
              <p className="text-xs text-salvia-600">
                Vacío: el backend usará "RIBANI" como apellido por defecto.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="invitacion-parentesco"
                className="block text-sm font-medium text-pino-900"
              >
                Parentesco <span className="text-salvia-500">(opcional)</span>
              </label>
              <Input
                id="invitacion-parentesco"
                placeholder="Hijo/a, vecino…"
                value={parentesco}
                onChange={(evento) => setParentesco(evento.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="invitacion-telefono"
                className="block text-sm font-medium text-pino-900"
              >
                Teléfono del adulto{' '}
                <span className="text-salvia-500">(opcional)</span>
              </label>
              <Input
                id="invitacion-telefono"
                type="tel"
                value={adultoTelefono}
                onChange={(evento) => setAdultoTelefono(evento.target.value)}
              />
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-pino-900">
              Permisos para el familiar invitado
            </legend>
            <div className="flex items-center gap-2">
              <input
                id="invitacion-ver-ubicacion"
                type="checkbox"
                className="h-4 w-4 rounded border-salvia-300 text-pino-600"
                checked={puedeVerUbicacion}
                onChange={(evento) =>
                  setPuedeVerUbicacion(evento.target.checked)
                }
              />
              <label
                htmlFor="invitacion-ver-ubicacion"
                className="text-sm text-pino-900"
              >
                Ver ubicación
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="invitacion-gestionar"
                type="checkbox"
                className="h-4 w-4 rounded border-salvia-300 text-pino-600"
                checked={puedeGestionar}
                onChange={(evento) => setPuedeGestionar(evento.target.checked)}
              />
              <label
                htmlFor="invitacion-gestionar"
                className="text-sm text-pino-900"
              >
                Gestionar medicamentos
              </label>
            </div>
          </fieldset>

          {invitar.isError && (
            <Alert variant="error">
              No se pudo enviar la invitación. Revisa los datos e intenta de
              nuevo.
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={onCerrar}
              disabled={invitar.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={invitar.isPending}>
              {invitar.isPending ? (
                <Spinner size="sm" label="Enviando invitación…" />
              ) : (
                'Enviar invitación'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
