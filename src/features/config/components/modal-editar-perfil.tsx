import { useState } from 'react'

import { useMutation } from '@tanstack/react-query'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { usuariosApi } from '@/features/usuarios'
import type { ActualizarPerfil } from '@/features/usuarios'
import { useAuthStore } from '@/stores/auth-store'

import { mensajeDeError } from '../lib/mensaje-error'

type ModalEditarPerfilProps = {
  abierto: boolean
  onCerrar: () => void
}

/**
 * Modal de edición del perfil PROPIO (cambio de usuario: nombre,
 * apellido y teléfono) abierto desde el lápiz de la sección Perfil.
 * Usa PATCH /usuarios/perfil (solo JWT) y refresca el usuario de
 * sesión para que header/side bar reflejen el cambio al instante.
 */
export function ModalEditarPerfil({ abierto, onCerrar }: ModalEditarPerfilProps) {
  return abierto ? <FormularioEditarPerfil onCerrar={onCerrar} /> : null
}

function FormularioEditarPerfil({ onCerrar }: Pick<ModalEditarPerfilProps, 'onCerrar'>) {
  const usuario = useAuthStore((state) => state.usuario)
  const actualizarUsuario = useAuthStore((state) => state.actualizarUsuario)

  const [nombre, setNombre] = useState(usuario?.nombre ?? '')
  const [apellido, setApellido] = useState(usuario?.apellido ?? '')
  const [telefono, setTelefono] = useState(usuario?.telefono ?? '')
  const [exito, setExito] = useState<string | null>(null)

  const guardar = useMutation({
    mutationFn: (datos: ActualizarPerfil) =>
      usuariosApi.actualizarMiPerfil(datos),
    onSuccess: (perfilActualizado) => {
      actualizarUsuario({
        nombre: perfilActualizado.nombre,
        apellido: perfilActualizado.apellido,
        telefono: perfilActualizado.telefono,
      })
      setExito('Perfil actualizado correctamente.')
    },
  })

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-perfil"
      className="fixed inset-0 z-50 flex items-center justify-center bg-pino-900/60 p-4"
    >
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <header className="border-b border-salvia-100 px-4 py-3">
          <h2
            id="titulo-modal-perfil"
            className="font-display text-base font-semibold text-pino-900"
          >
            Editar perfil
          </h2>
          <p className="mt-0.5 text-xs text-salvia-600">
            Cambia tus datos personales. El correo es tu identificador de
            acceso y no se modifica aquí.
          </p>
        </header>

        <form
          className="space-y-4 p-4"
          onSubmit={(evento) => {
            evento.preventDefault()
            setExito(null)
            guardar.mutate({
              nombre: nombre.trim(),
              apellido: apellido.trim(),
              telefono: telefono.trim(),
            })
          }}
        >
          <div className="space-y-1.5">
            <label
              htmlFor="modal-perfil-nombre"
              className="block text-sm font-medium text-pino-900"
            >
              Nombre
            </label>
            <Input
              id="modal-perfil-nombre"
              autoComplete="given-name"
              required
              maxLength={80}
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="modal-perfil-apellido"
              className="block text-sm font-medium text-pino-900"
            >
              Apellido
            </label>
            <Input
              id="modal-perfil-apellido"
              autoComplete="family-name"
              required
              maxLength={100}
              value={apellido}
              onChange={(evento) => setApellido(evento.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="modal-perfil-telefono"
              className="block text-sm font-medium text-pino-900"
            >
              Teléfono
            </label>
            <Input
              id="modal-perfil-telefono"
              type="tel"
              autoComplete="tel"
              maxLength={20}
              placeholder="Opcional"
              value={telefono}
              onChange={(evento) => {
                setTelefono(evento.target.value.replace(/[^\d\s()+-]/g, ''))
                setExito(null)
              }}
            />
            <p className="text-xs text-salvia-600">
              Deja el campo vacío para quitarlo de tu perfil.
            </p>
          </div>

          {guardar.isError && (
            <Alert variant="error">{mensajeDeError(guardar.error)}</Alert>
          )}

          {exito && <Alert variant="success">{exito}</Alert>}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              disabled={guardar.isPending}
              onClick={onCerrar}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                guardar.isPending || !nombre.trim() || !apellido.trim()
              }
            >
              {guardar.isPending ? (
                <Spinner size="sm" label="Guardando…" />
              ) : exito ? (
                'Guardar de nuevo'
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
