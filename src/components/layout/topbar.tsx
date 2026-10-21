import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useLogout } from '@/features/auth'
import { useAuthStore } from '@/stores/auth-store'

import { Spinner } from '@/components/ui/spinner'

type TopbarProps = {
  onAbrirMenu: () => void
}

/** Iniciales del nombre real para el avatar circular. */
function iniciales(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
}

/**
 * Topbar comprimido (petición de RIBANI): los datos del usuario
 * (nombre, rol) y la acción Salir ya no flotan sueltos; se agrupan en
 * un único botón que despliega Configuración y Salir.
 */
export function Topbar({ onAbrirMenu }: TopbarProps) {
  const usuario = useAuthStore((state) => state.usuario)
  const { cerrarSesion, pendiente } = useLogout()

  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <header className="flex h-14 items-center gap-3 border-b border-salvia-200 bg-white px-4">
      <button
        type="button"
        className="rounded-md p-2 text-salvia-700 hover:bg-salvia-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600 lg:hidden"
        aria-label="Abrir menú"
        onClick={onAbrirMenu}
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      <div className="relative ml-auto">
        {/* Datos comprimidos: avatar con iniciales + nombre corto. */}
        <button
          type="button"
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-medium text-pino-900 transition-colors hover:bg-salvia-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600"
          aria-haspopup="menu"
          aria-expanded={menuAbierto}
          onClick={() => setMenuAbierto((abierto) => !abierto)}
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-pino-700 text-xs font-semibold text-white"
          >
            {usuario ? iniciales(usuario.nombre, usuario.apellido) : '--'}
          </span>
          <span className="hidden text-left sm:block">
            {usuario?.nombre}
            <span className="block text-xs font-normal text-salvia-600">
              {usuario?.rol.nombre}
            </span>
          </span>
          <svg
            className="h-4 w-4 text-salvia-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {menuAbierto && (
          <>
            {/* Cierra el menú al hacer clic fuera (patrón del Sidebar). */}
            <button
              type="button"
              className="fixed inset-0 z-30 cursor-default"
              aria-label="Cerrar menú de usuario"
              onClick={() => setMenuAbierto(false)}
            />

            <div
              role="menu"
              aria-label="Menú de usuario"
              className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-lg border border-salvia-200 bg-white shadow-lg"
            >
              <div className="border-b border-salvia-100 px-4 py-3 sm:hidden">
                <p className="text-sm font-medium text-pino-900">
                  {usuario?.nombre} {usuario?.apellido}
                </p>
                <p className="text-xs font-normal text-salvia-600">
                  {usuario?.rol.nombre}
                </p>
              </div>

              <Link
                to="/panel/config"
                role="menuitem"
                className="block px-4 py-2.5 text-sm font-medium text-pino-900 hover:bg-salvia-100"
                onClick={() => setMenuAbierto(false)}
              >
                Configuración
              </Link>

              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                disabled={pendiente}
                onClick={() => void cerrarSesion()}
              >
                Salir
                {pendiente && <Spinner size="sm" label="Cerrando sesión…" />}
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
