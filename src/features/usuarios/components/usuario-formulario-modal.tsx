import { useState } from 'react'
import type { FormEvent } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useActualizarUsuario, useCrearUsuario, useRoles } from '../hooks'
import type { UsuarioLista } from '../types'

type UsuarioFormularioModalProps = {
  abierto: boolean
  /** Usuario a editar; null = modo creación. */
  usuarioEditar: UsuarioLista | null
  onCerrar: () => void
}



export function UsuarioFormularioModal({
  abierto,
  usuarioEditar,
  onCerrar,
}: UsuarioFormularioModalProps) {
  const crear = useCrearUsuario()
  const actualizar = useActualizarUsuario()
  const roles = useRoles()

  const mutacion = usuarioEditar ? actualizar : crear
  const enCurso = crear.isPending || actualizar.isPending

  const [nombre, setNombre] = useState(usuarioEditar?.nombre ?? '')
  const [apellido, setApellido] = useState(usuarioEditar?.apellido ?? '')
  const [email, setEmail] = useState(usuarioEditar?.email ?? '')
  const [telefono, setTelefono] = useState(usuarioEditar?.telefono ?? '')
  const [password, setPassword] = useState('')
  const [rolCodigo, setRolCodigo] = useState(
    usuarioEditar ? String(usuarioEditar.rol_id) : '',
  )

  if (!abierto) return null

  function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    if (usuarioEditar) {
      actualizar.mutate(
        {
          id: usuarioEditar.id,
          datos: {
            rol_codigo: rolCodigo,
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            email: email.trim(),
            telefono: telefono.trim() || undefined,
            // Solo enviar password si el usuario escribió una nueva.
            ...(password ? { password } : {}),
          },
        },
        { onSuccess: onCerrar },
      )
      return
    }

    crear.mutate(
      {
        rol_codigo: rolCodigo,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim(),
        telefono: telefono.trim() || undefined,
        password,
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
        aria-labelledby="titulo-usuario-modal"
        className="relative w-full max-w-md rounded-lg border border-salvia-200 bg-white p-6 shadow-lg"
      >
        <h2
          id="titulo-usuario-modal"
          className="font-display text-lg font-semibold text-pino-900"
        >
          {usuarioEditar ? 'Editar usuario' : 'Nuevo usuario'}
        </h2>
        <p className="mt-1 text-sm/6 text-salvia-700">
          {usuarioEditar
            ? `Modifica los datos de ${usuarioEditar.nombre} ${usuarioEditar.apellido}.`
            : 'Crea una cuenta para administradores, familiares o adultos mayores.'}
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="usuario-nombre"
                className="block text-sm font-medium text-pino-900"
              >
                Nombre
              </label>
              <Input
                id="usuario-nombre"
                required
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="usuario-apellido"
                className="block text-sm font-medium text-pino-900"
              >
                Apellido
              </label>
              <Input
                id="usuario-apellido"
                required
                value={apellido}
                onChange={(evento) => setApellido(evento.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="usuario-email"
              className="block text-sm font-medium text-pino-900"
            >
              Correo electrónico
            </label>
            <Input
              id="usuario-email"
              type="email"
              autoComplete="off"
              required
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="usuario-telefono"
              className="block text-sm font-medium text-pino-900"
            >
              Teléfono <span className="text-salvia-500">(opcional)</span>
            </label>
            <Input
              id="usuario-telefono"
              type="tel"
              value={telefono}
              onChange={(evento) => setTelefono(evento.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="usuario-rol"
              className="block text-sm font-medium text-pino-900"
            >
              Rol
            </label>
            <select
              id="usuario-rol"
              required
              className="w-full rounded-md border border-salvia-300 bg-white px-3 py-2 text-sm text-pino-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600"
              value={rolCodigo}
              onChange={(evento) => setRolCodigo(evento.target.value)}
            >
              <option value="" disabled>
                Selecciona un rol
              </option>
              {roles.data
                ?.filter((rol) => rol.activo)
                .map((rol) => (
                  <option key={rol.id} value={rol.codigo}>
                    {rol.nombre}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="usuario-password"
              className="block text-sm font-medium text-pino-900"
            >
              Contraseña{' '}
              {usuarioEditar && (
                <span className="text-salvia-500">(opcional)</span>
              )}
            </label>
            <Input
              id="usuario-password"
              type="password"
              autoComplete="new-password"
              required={!usuarioEditar}
              minLength={8}
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
            />
            <p className="text-xs text-salvia-600">
              {usuarioEditar
                ? 'Déjalo vacío para mantener la contraseña actual.'
                : 'Mínimo 8 caracteres.'}
            </p>
          </div>

          {mutacion.isError && (
            <Alert variant="error">
              No se pudieron guardar los cambios. Revisa los datos e intenta de
              nuevo.
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={onCerrar}
              disabled={enCurso}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={enCurso}>
              {enCurso ? (
                <Spinner
                  size="sm"
                  label={usuarioEditar ? 'Guardando cambios…' : 'Creando usuario…'}
                />
              ) : usuarioEditar ? (
                'Guardar cambios'
              ) : (
                'Crear usuario'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
