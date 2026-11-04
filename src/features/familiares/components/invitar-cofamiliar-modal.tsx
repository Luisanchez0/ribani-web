import { useState } from 'react'
import type { FormEvent } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useInvitarCofamiliar } from '../hooks'
import type { AdultoVinculado } from '../types'

/**
 * Los mensajes del backend para este endpoint ya están redactados para el
 * usuario (403/404/409/429); el resto cae en un mensaje genérico.
 */
function mensajeDeError(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'status' in error.response &&
    typeof error.response.status === 'number' &&
    [403, 404, 409, 429].includes(error.response.status) &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'message' in error.response.data &&
    typeof error.response.data.message === 'string'
  ) {
    return error.response.data.message
  }

  return 'No se pudo enviar la invitación. Revisa los datos e intenta de nuevo.'
}

/**
 * Invita a otro familiar (con cuenta propia) a acompañar a `adulto`.
 * Los permisos parten de los del usuario: no puede conceder más de los que
 * tiene, y el backend lo vuelve a validar.
 */
export function InvitarCofamiliarModal({
  adulto,
  onCerrar,
}: {
  adulto: AdultoVinculado
  onCerrar: () => void
}) {
  const invitar = useInvitarCofamiliar()

  const [email, setEmail] = useState('')
  const [parentesco, setParentesco] = useState('')
  const [puedeVerUbicacion, setPuedeVerUbicacion] = useState(
    adulto.puede_ver_ubicacion,
  )
  const [puedeGestionar, setPuedeGestionar] = useState(
    adulto.puede_gestionar_medicamentos,
  )
  const [enviada, setEnviada] = useState(false)

  const nombreAdulto = `${adulto.nombre} ${adulto.apellido}`.trim()

  function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    invitar.mutate(
      {
        adulto_id: adulto.id,
        familiar_email: email.trim(),
        parentesco: parentesco.trim() || undefined,
        puede_ver_ubicacion: puedeVerUbicacion,
        puede_gestionar_medicamentos: puedeGestionar,
      },
      { onSuccess: () => setEnviada(true) },
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
        aria-labelledby="titulo-cofamiliar-modal"
        className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-lg border border-salvia-200 bg-white p-6 shadow-lg"
      >
        <h2
          id="titulo-cofamiliar-modal"
          className="font-display text-lg font-semibold text-pino-900"
        >
          Invitar a otro familiar
        </h2>
        <p className="mt-1 text-sm/6 text-salvia-700">
          Comparte el cuidado de <strong>{nombreAdulto}</strong> con otra
          persona. {adulto.nombre} deberá aceptar la invitación desde su
          aplicación para que tenga acceso.
        </p>

        {enviada ? (
          <div className="mt-5 space-y-4">
            <Alert variant="success">
              Invitación enviada a {email.trim()}. Aparecerá en el teléfono de{' '}
              {adulto.nombre} para que la acepte.
            </Alert>
            <div className="flex justify-end">
              <Button onClick={onCerrar}>Listo</Button>
            </div>
          </div>
        ) : (
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label
                htmlFor="cofamiliar-email"
                className="block text-sm font-medium text-pino-900"
              >
                Correo del familiar
              </label>
              <Input
                id="cofamiliar-email"
                type="email"
                required
                autoComplete="off"
                aria-describedby="cofamiliar-email-ayuda"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
              />
              <p id="cofamiliar-email-ayuda" className="text-xs text-salvia-600">
                Debe tener ya una cuenta familiar en RIBANI con este correo.
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="cofamiliar-parentesco"
                className="block text-sm font-medium text-pino-900"
              >
                Parentesco con {adulto.nombre}{' '}
                <span className="text-salvia-500">(opcional)</span>
              </label>
              <Input
                id="cofamiliar-parentesco"
                placeholder="Hijo/a, sobrino/a, vecino…"
                maxLength={40}
                value={parentesco}
                onChange={(evento) => setParentesco(evento.target.value)}
              />
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-pino-900">
                Acceso que tendrá
              </legend>
              <div className="flex items-center gap-2">
                <input
                  id="cofamiliar-ubicacion"
                  type="checkbox"
                  className="h-4 w-4 rounded border-salvia-300 text-pino-600 disabled:opacity-50"
                  checked={puedeVerUbicacion}
                  disabled={!adulto.puede_ver_ubicacion}
                  onChange={(evento) =>
                    setPuedeVerUbicacion(evento.target.checked)
                  }
                />
                <label
                  htmlFor="cofamiliar-ubicacion"
                  className="text-sm text-pino-900"
                >
                  Ver ubicación
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="cofamiliar-medicamentos"
                  type="checkbox"
                  className="h-4 w-4 rounded border-salvia-300 text-pino-600 disabled:opacity-50"
                  checked={puedeGestionar}
                  disabled={!adulto.puede_gestionar_medicamentos}
                  onChange={(evento) => setPuedeGestionar(evento.target.checked)}
                />
                <label
                  htmlFor="cofamiliar-medicamentos"
                  className="text-sm text-pino-900"
                >
                  Gestionar medicamentos
                </label>
              </div>
              {(!adulto.puede_ver_ubicacion ||
                !adulto.puede_gestionar_medicamentos) && (
                <p className="text-xs text-salvia-600">
                  Solo puedes compartir los permisos que tú tienes.
                </p>
              )}
            </fieldset>

            {invitar.isError && (
              <Alert variant="error">{mensajeDeError(invitar.error)}</Alert>
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
        )}
      </div>
    </div>
  )
}
