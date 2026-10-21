import { useState } from 'react'

import { useMutation } from '@tanstack/react-query'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { usuariosApi } from '@/features/usuarios'
import type { CambiarPassword } from '@/features/usuarios'

import { mensajeDeError } from '../lib/mensaje-error'

type ModalCambiarPasswordProps = {
  abierto: boolean
  onCerrar: () => void
}

/**
 * Modal de cambio de CONTRASEÑA PROPIA, abierto desde el lápiz de la
 * sección Acceso de Configuración. Pide la contraseña actual
 * (verificada en el backend con bcrypt) y la nueva con repetición;
 * usa PATCH /usuarios/perfil/password (solo JWT).
 */
export function ModalCambiarPassword({
  abierto,
  onCerrar,
}: ModalCambiarPasswordProps) {
  return abierto ? <FormularioCambiarPassword onCerrar={onCerrar} /> : null
}

function FormularioCambiarPassword({ onCerrar }: Pick<ModalCambiarPasswordProps, 'onCerrar'>) {
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [passwordRepetida, setPasswordRepetida] = useState('')
  const [exito, setExito] = useState<string | null>(null)
  const [avisoValidacion, setAvisoValidacion] = useState<string | null>(null)

  const cambiar = useMutation({
    mutationFn: (datos: CambiarPassword) =>
      usuariosApi.cambiarMiPassword(datos),
    onSuccess: () => {
      setExito('Tu contraseña se actualizó correctamente.')
    },
  })

  function handleSubmit(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    if (passwordNueva !== passwordRepetida) {
      setAvisoValidacion('Las contraseñas nuevas no coinciden.')
      return
    }
    if (passwordNueva === passwordActual) {
      setAvisoValidacion(
        'La contraseña nueva debe ser distinta de la actual.',
      )
      return
    }

    setAvisoValidacion(null)
    setExito(null)
    cambiar.mutate({
      password_actual: passwordActual,
      password: passwordNueva,
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-password"
      className="fixed inset-0 z-50 flex items-center justify-center bg-pino-900/60 p-4"
    >
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <header className="border-b border-salvia-100 px-4 py-3">
          <h2
            id="titulo-modal-password"
            className="font-display text-base font-semibold text-pino-900"
          >
            Cambiar contraseña
          </h2>
          <p className="mt-0.5 text-xs text-salvia-600">
            Por seguridad, confirma tu contraseña actual antes de definir
            la nueva (mínimo 8 caracteres).
          </p>
        </header>

        <form className="space-y-4 p-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label
              htmlFor="modal-password-actual"
              className="block text-sm font-medium text-pino-900"
            >
              Contraseña actual
            </label>
            <Input
              id="modal-password-actual"
              type="password"
              autoComplete="current-password"
              required
              value={passwordActual}
              onChange={(evento) => {
                setPasswordActual(evento.target.value)
                setExito(null)
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="modal-password-nueva"
              className="block text-sm font-medium text-pino-900"
            >
              Contraseña nueva
            </label>
            <Input
              id="modal-password-nueva"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={passwordNueva}
              onChange={(evento) => {
                setPasswordNueva(evento.target.value)
                setExito(null)
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="modal-password-repetida"
              className="block text-sm font-medium text-pino-900"
            >
              Repetir contraseña nueva
            </label>
            <Input
              id="modal-password-repetida"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={passwordRepetida}
              onChange={(evento) => {
                setPasswordRepetida(evento.target.value)
                setExito(null)
              }}
            />
          </div>

          {avisoValidacion && <Alert variant="error">{avisoValidacion}</Alert>}

          {cambiar.isError && (
            <Alert variant="error">{mensajeDeError(cambiar.error)}</Alert>
          )}

          {exito && <Alert variant="success">{exito}</Alert>}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              disabled={cambiar.isPending}
              onClick={onCerrar}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                cambiar.isPending ||
                !passwordActual ||
                !passwordNueva ||
                !passwordRepetida
              }
            >
              {cambiar.isPending ? (
                <Spinner size="sm" label="Actualizando…" />
              ) : exito ? (
                'Cambiar de nuevo'
              ) : (
                'Actualizar contraseña'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
