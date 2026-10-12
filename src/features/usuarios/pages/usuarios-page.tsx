import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { IconoUsuarios } from '@/lib/iconos'

import { UsuariosTabla } from '../components/usuarios-tabla'
import { UsuarioFormularioModal } from '../components/usuario-formulario-modal'
import {
  useActivarUsuario,
  useDesactivarUsuario,
  useEliminarUsuario,
  useUsuarios,
} from '../hooks'
import type { UsuarioLista } from '../types'

/** Traduce errores HTTP a mensajes comprensibles (ver AGENTS.md). */
function mensajeDeError(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'status' in error.response
  ) {
    const status = error.response.status
    if (status === 403) {
      return 'No tienes permisos para administrar usuarios.'
    }
  }

  return 'No se pudieron cargar los usuarios. Verifica tu conexión e intenta de nuevo.'
}

/**
 * Administración de usuarios (/admin/usuarios).
 * Consumo real de GET /usuarios mediante TanStack Query.
 */
export function UsuariosPage() {
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [usuarioEditar, setUsuarioEditar] = useState<UsuarioLista | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  const filtros = busqueda.trim() ? { buscar: busqueda.trim() } : undefined
  const usuarios = useUsuarios(filtros)

  const activar = useActivarUsuario()
  const desactivar = useDesactivarUsuario()
  const eliminar = useEliminarUsuario()

  /** Ids con una mutation en curso, para deshabilitar solo esa fila. */
  const ocupados = new Set<string>([
    ...(activar.isPending && activar.variables ? [activar.variables] : []),
    ...(desactivar.isPending && desactivar.variables
      ? [desactivar.variables]
      : []),
    ...(eliminar.isPending && eliminar.variables
      ? [eliminar.variables]
      : []),
  ])

  /** Desactivar = baja lógica (PATCH /desactivar); Activar = reactivar. */
  function alternarActivo(usuario: UsuarioLista) {
    setErrorAccion(null)

    if (usuario.activo) {
      desactivar.mutate(usuario.id, {
        onError: () =>
          setErrorAccion(`No se pudo desactivar a ${usuario.nombre}.`),
      })
      return
    }

    activar.mutate(usuario.id, {
      onError: () => setErrorAccion(`No se pudo activar a ${usuario.nombre}.`),
    })
  }

  function eliminarUsuario(usuario: UsuarioLista) {
    const confirmado = window.confirm(
      `¿Eliminar definitivamente a ${usuario.nombre} ${usuario.apellido}? Esta acción no se puede deshacer.`,
    )

    if (!confirmado) return

    setErrorAccion(null)
    eliminar.mutate(usuario.id, {
      onError: () =>
        setErrorAccion(`No se pudo eliminar a ${usuario.nombre}.`),
    })
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-pino-900">
          <IconoUsuarios size={24} className="text-pino-600" />
          Usuarios
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="buscar-usuario" className="sr-only">
            Buscar usuario
          </label>
          <input
            id="buscar-usuario"
            type="search"
            placeholder="Buscar por nombre o correo…"
            className="w-56 rounded-md border border-salvia-300 bg-white px-3 py-2 text-sm text-pino-950 placeholder:text-salvia-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
          />
          <Button
            onClick={() => {
              setUsuarioEditar(null)
              setModalAbierto(true)
            }}
          >
            Nuevo usuario
          </Button>
        </div>
      </div>

      {errorAccion && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {errorAccion}
        </div>
      )}

      <div className="rounded-lg border border-salvia-200 bg-white shadow-sm">
        {usuarios.isPending ? (
          <div className="flex items-center justify-center gap-3 p-10 text-sm text-salvia-600">
            <Spinner size="sm" label="Cargando usuarios" />
            Cargando usuarios…
          </div>
        ) : usuarios.isError ? (
          <div className="space-y-3 p-6">
            <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              {mensajeDeError(usuarios.error)}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void usuarios.refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : usuarios.data.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-pino-900">
              No hay usuarios que coincidan con la búsqueda
            </p>
            <p className="mt-1 text-sm text-salvia-600">
              Prueba con otro nombre o correo, o crea un usuario nuevo.
            </p>
          </div>
        ) : (
          <UsuariosTabla
            usuarios={usuarios.data}
            ocupados={ocupados}
            onEditar={(usuario) => {
              setErrorAccion(null)
              setUsuarioEditar(usuario)
              setModalAbierto(true)
            }}
            onAlternarActivo={alternarActivo}
            onEliminar={eliminarUsuario}
          />
        )}
      </div>

      {/* key distinta por modo/usuario: remonta y reinicia el formulario. */}
      <UsuarioFormularioModal
        key={usuarioEditar?.id ?? 'nuevo'}
        abierto={modalAbierto}
        usuarioEditar={usuarioEditar}
        onCerrar={() => {
          setModalAbierto(false)
          setUsuarioEditar(null)
        }}
      />
    </section>
  )
}
