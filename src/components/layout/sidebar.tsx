import { NavLink } from 'react-router-dom'

import { ROL_ADMINISTRADOR } from '@/app/guards/require-role'
import { useAuthStore } from '@/stores/auth-store'

type ItemNavegacion = {
  to: string
  etiqueta: string
  end?: boolean
}

const itemsPanel: ItemNavegacion[] = [
  { to: '/panel', etiqueta: 'Inicio', end: true },
  { to: '/panel/ubicaciones', etiqueta: 'Ubicaciones' },
  { to: '/panel/alertas', etiqueta: 'Alertas' },
  { to: '/panel/zonas-seguras', etiqueta: 'Zonas seguras' },
  { to: '/panel/medicamentos', etiqueta: 'Medicamentos' },
  { to: '/panel/contactos', etiqueta: 'Contactos' },
  { to: '/panel/dispositivos', etiqueta: 'Dispositivos' },
]

const itemsAdmin: ItemNavegacion[] = [
  { to: '/admin/usuarios', etiqueta: 'Usuarios' },
  { to: '/admin/roles', etiqueta: 'Roles' },
  { to: '/admin/auditoria', etiqueta: 'Auditoría' },
]

const claseItem = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-slate-700 text-white'
      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
  }`

type SidebarProps = {
  abierto: boolean
  onCerrar: () => void
}

/**
 * Navegación global. En pantallas pequeñas se muestra como panel
 * deslizable; en desktop queda fija (ver AGENTS.md → Responsive).
 */
export function Sidebar({ abierto, onCerrar }: SidebarProps) {
  const esAdmin =
    useAuthStore((state) => state.usuario)?.rol.codigo ===
    ROL_ADMINISTRADOR

  return (
    <>
      {abierto && (
        <button
          type="button"
          className="fixed inset-0 z-30 cursor-default bg-slate-900/50 lg:hidden"
          aria-label="Cerrar menú"
          onClick={onCerrar}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 bg-slate-900 transition-transform lg:static lg:translate-x-0 ${
          abierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav
          className="flex h-full flex-col gap-1 overflow-y-auto p-4"
          aria-label="Navegación principal"
        >
          <span className="px-3 pb-4 text-lg font-semibold tracking-tight text-white">
            RIBANI
          </span>

          {itemsPanel.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={claseItem}
              onClick={onCerrar}
            >
              {item.etiqueta}
            </NavLink>
          ))}

          {esAdmin && (
            <>
              <span className="px-3 pt-6 pb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Administración
              </span>
              {itemsAdmin.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={claseItem}
                  onClick={onCerrar}
                >
                  {item.etiqueta}
                </NavLink>
              ))}
            </>
          )}
        </nav>
      </aside>
    </>
  )
}
