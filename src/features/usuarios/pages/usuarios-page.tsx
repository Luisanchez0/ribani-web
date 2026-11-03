import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { IconoUsuarios } from '@/lib/iconos'
import { BARRA_FILTROS, CONTROL_FILTRO } from '@/lib/clases-filtros'

import { UsuariosTabla } from '../components/usuarios-tabla'
import { UsuarioFormularioModal } from '../components/usuario-formulario-modal'
import {
  useActivarUsuario,
  useDesactivarUsuario,
  useEliminarUsuario,
  useRoles,
  useUsuarios,
} from '../hooks'
import type { UsuarioLista } from '../types'

type FiltroDosFa = '' | 'activo' | 'inactivo'
type FiltroEstado = '' | 'activo' | 'inactivo'
type FiltroAcceso = '' | '24h' | '7d' | '30d' | 'mas-30d' | 'nunca'

const DIA_MS = 24 * 60 * 60 * 1000

/** ¿El último acceso cae en el rango elegido? */
function cumpleAcceso(
  ultimoAcceso: string | null,
  filtro: FiltroAcceso,
  ahora: number,
): boolean {
  if (!filtro) return true
  if (filtro === 'nunca') return ultimoAcceso === null
  if (ultimoAcceso === null) return false

  const transcurrido = ahora - new Date(ultimoAcceso).getTime()
  switch (filtro) {
    case '24h':
      return transcurrido <= DIA_MS
    case '7d':
      return transcurrido <= 7 * DIA_MS
    case '30d':
      return transcurrido <= 30 * DIA_MS
    case 'mas-30d':
      return transcurrido > 30 * DIA_MS
  }
}

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

  const [rolFiltro, setRolFiltro] = useState('')
  const [dosFaFiltro, setDosFaFiltro] = useState<FiltroDosFa>('')
  const [estadoFiltro, setEstadoFiltro] = useState<FiltroEstado>('')
  const [accesoFiltro, setAccesoFiltro] = useState<FiltroAcceso>('')

  // Búsqueda y rol los resuelve el backend (GET /usuarios?buscar&rol).
  const filtros =
    busqueda.trim() || rolFiltro
      ? {
          ...(busqueda.trim() ? { buscar: busqueda.trim() } : {}),
          ...(rolFiltro ? { rol: rolFiltro } : {}),
        }
      : undefined
  const usuarios = useUsuarios(filtros)
  const roles = useRoles()

  const nombreRol = useMemo(
    () => new Map((roles.data ?? []).map((rol) => [rol.id, rol.nombre])),
    [roles.data],
  )

  // 2FA, estado y último acceso no son parámetros del backend: como
  // GET /usuarios devuelve la lista completa (sin paginar), se filtran aquí.
  // Los rangos se miden desde la última carga de la lista (render puro).
  const cargadaEn = usuarios.dataUpdatedAt
  const visibles = useMemo(() => {
    const ahora = cargadaEn
    return (usuarios.data ?? []).filter((usuario) => {
      if (dosFaFiltro === 'activo' && !usuario.two_factor_enabled) return false
      if (dosFaFiltro === 'inactivo' && usuario.two_factor_enabled) return false
      if (estadoFiltro === 'activo' && !usuario.activo) return false
      if (estadoFiltro === 'inactivo' && usuario.activo) return false
      return cumpleAcceso(usuario.ultimo_acceso_en, accesoFiltro, ahora)
    })
  }, [usuarios.data, cargadaEn, dosFaFiltro, estadoFiltro, accesoFiltro])

  const hayFiltros =
    !!busqueda.trim() || !!rolFiltro || !!dosFaFiltro || !!estadoFiltro || !!accesoFiltro

  function limpiarFiltros() {
    setBusqueda('')
    setRolFiltro('')
    setDosFaFiltro('')
    setEstadoFiltro('')
    setAccesoFiltro('')
  }

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

        <Button
          onClick={() => {
            setUsuarioEditar(null)
            setModalAbierto(true)
          }}
        >
          Nuevo usuario
        </Button>
      </div>

      <div className={BARRA_FILTROS}>
        <label htmlFor="buscar-usuario" className="block text-sm font-medium text-salvia-700">
          Buscar usuario
          <input
            id="buscar-usuario"
            type="search"
            placeholder="Nombre o correo…"
            className={CONTROL_FILTRO}
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
          />
        </label>

        <div>
          <label htmlFor="filtro-usuario-rol" className="block text-sm font-medium text-salvia-700">
            Rol
          </label>
          <Select
            id="filtro-usuario-rol"
            value={rolFiltro}
            onChange={(e) => setRolFiltro(e.target.value)}
            className="mt-1.5"
          >
            <option value="">Todos</option>
            {(roles.data ?? []).map((rol) => (
              <option key={rol.id} value={rol.codigo}>
                {rol.nombre}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="filtro-usuario-2fa" className="block text-sm font-medium text-salvia-700">
            Verificación en dos pasos (2FA)
          </label>
          <Select
            id="filtro-usuario-2fa"
            value={dosFaFiltro}
            onChange={(e) => setDosFaFiltro(e.target.value as FiltroDosFa)}
            className="mt-1.5"
          >
            <option value="">Todos</option>
            <option value="activo">Con 2FA</option>
            <option value="inactivo">Sin 2FA</option>
          </Select>
        </div>

        <div>
          <label htmlFor="filtro-usuario-estado" className="block text-sm font-medium text-salvia-700">
            Estado
          </label>
          <Select
            id="filtro-usuario-estado"
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value as FiltroEstado)}
            className="mt-1.5"
          >
            <option value="">Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </Select>
        </div>

        <div>
          <label htmlFor="filtro-usuario-acceso" className="block text-sm font-medium text-salvia-700">
            Último acceso
          </label>
          <Select
            id="filtro-usuario-acceso"
            value={accesoFiltro}
            onChange={(e) => setAccesoFiltro(e.target.value as FiltroAcceso)}
            className="mt-1.5"
          >
            <option value="">Cualquier fecha</option>
            <option value="24h">Últimas 24 horas</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="mas-30d">Hace más de 30 días</option>
            <option value="nunca">Nunca ha accedido</option>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-salvia-700">
        <p aria-live="polite">
          {usuarios.isSuccess &&
            `${visibles.length} ${visibles.length === 1 ? 'usuario' : 'usuarios'}`}
        </p>
        {hayFiltros && (
          <Button variant="secondary" size="sm" onClick={limpiarFiltros}>
            Limpiar filtros
          </Button>
        )}
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
        ) : visibles.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-pino-900">
              No hay usuarios que coincidan con los filtros
            </p>
            <p className="mt-1 text-sm text-salvia-600">
              Ajusta o limpia los filtros, o crea un usuario nuevo.
            </p>
          </div>
        ) : (
          <UsuariosTabla
            usuarios={visibles}
            nombreRol={nombreRol}
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
