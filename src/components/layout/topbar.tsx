import { useLogout } from '@/features/auth'
import { useAuthStore } from '@/stores/auth-store'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

type TopbarProps = {
  onAbrirMenu: () => void
}

export function Topbar({ onAbrirMenu }: TopbarProps) {
  const usuario = useAuthStore((state) => state.usuario)
  const { cerrarSesion, pendiente } = useLogout()

  return (
    <header className="flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4">
      <button
        type="button"
        className="rounded-md p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:hidden"
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

      <div className="ml-auto flex items-center gap-3">
        {usuario && (
          <span className="hidden text-sm text-slate-700 sm:inline">
            {usuario.nombre} {usuario.apellido}
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {usuario.rol.nombre}
            </span>
          </span>
        )}
        <Button
          variant="secondary"
          size="sm"
          disabled={pendiente}
          onClick={() => void cerrarSesion()}
        >
          {pendiente ? <Spinner size="sm" label="Cerrando sesión…" /> : 'Salir'}
        </Button>
      </div>
    </header>
  )
}
