import { NavLink } from 'react-router-dom'
import type { ComponentType } from 'react'

import { ROL_ADMINISTRADOR } from '@/app/guards/require-role'
import { EscudoRibani } from '@/components/ui/escudo'
import {
  IconoAlertas,
  IconoAuditoria,
  IconoContactos,
  IconoDispositivos,
  IconoFamiliares,
  IconoInicio,
  IconoMedicamentos,
  IconoRoles,
  IconoUbicaciones,
  IconoUsuarios,
  IconoZonasSeguras,
} from '@/lib/iconos'
import { useAuthStore } from '@/stores/auth-store'

type ItemNavegacion = {
  to: string
  etiqueta: string
  Icono: ComponentType<{ size?: number }>
  end?: boolean
}

/**
 * Panel de seguimiento (vista familiar/adulto).
 * Para el ADMINISTRADOR, Ubicaciones/Medicamentos/Contactos/Familiares
 * viven en la sección Administración (evita duplicados en el menú).
 */
const itemsPanel: ItemNavegacion[] = [
  { to: '/panel', etiqueta: 'Inicio', Icono: IconoInicio, end: true },
  { to: '/panel/alertas', etiqueta: 'Alertas', Icono: IconoAlertas },
  { to: '/panel/zonas-seguras', etiqueta: 'Zonas seguras', Icono: IconoZonasSeguras },
  { to: '/panel/dispositivos', etiqueta: 'Dispositivos', Icono: IconoDispositivos },
]

const itemsPanelFamiliar: ItemNavegacion[] = [
  { to: '/panel', etiqueta: 'Inicio', Icono: IconoInicio, end: true },
  { to: '/panel/ubicaciones', etiqueta: 'Ubicaciones', Icono: IconoUbicaciones },
  { to: '/panel/alertas', etiqueta: 'Alertas', Icono: IconoAlertas },
  { to: '/panel/zonas-seguras', etiqueta: 'Zonas seguras', Icono: IconoZonasSeguras },
  { to: '/panel/medicamentos', etiqueta: 'Medicamentos', Icono: IconoMedicamentos },
  { to: '/panel/contactos', etiqueta: 'Contactos', Icono: IconoContactos },
  { to: '/panel/dispositivos', etiqueta: 'Dispositivos', Icono: IconoDispositivos },
  { to: '/panel/familiares', etiqueta: 'Familiares', Icono: IconoFamiliares },
]

/** Sección Administración del sistema (solo ADMINISTRADOR). */
const itemsAdmin: ItemNavegacion[] = [
  { to: '/admin', etiqueta: 'Usuarios', Icono: IconoUsuarios, end: true },
  { to: '/admin/ubicaciones', etiqueta: 'Ubicaciones', Icono: IconoUbicaciones },
  { to: '/admin/relaciones', etiqueta: 'Relaciones familiares', Icono: IconoFamiliares },
  { to: '/admin/alertas', etiqueta: 'Alertas', Icono: IconoAlertas },
  { to: '/admin/medicamentos', etiqueta: 'Medicamentos', Icono: IconoMedicamentos },
  { to: '/admin/contactos', etiqueta: 'Contactos', Icono: IconoContactos },
  { to: '/admin/roles', etiqueta: 'Roles', Icono: IconoRoles },
  { to: '/admin/auditoria', etiqueta: 'Auditoría', Icono: IconoAuditoria },
]

const claseItem = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-pino-100/10 text-white ring-1 ring-pino-300/40'
      : 'text-pino-200 hover:bg-pino-800 hover:text-white'
  }`

type SidebarProps = {
  abierto: boolean
  onCerrar: () => void
}



export function Sidebar({ abierto, onCerrar }: SidebarProps) {
  const usuario = useAuthStore((state) => state.usuario)
  const esAdmin = usuario?.rol.codigo === ROL_ADMINISTRADOR

  return (
    <>
      {abierto && (
        <button
          type="button"
          className="fixed inset-0 z-30 cursor-default bg-pino-950/60 lg:hidden"
          aria-label="Cerrar menú"
          onClick={onCerrar}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 bg-pino-900 transition-transform lg:static lg:translate-x-0 ${
          abierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav
          className="flex h-full flex-col gap-1 overflow-y-auto p-4"
          aria-label="Navegación principal"
        >
          <span className="flex items-center gap-2.5 px-3 pb-6 font-display text-xl font-semibold tracking-tight text-white">
            {/* Escudo provisional de RIBANI (falta logo definitivo) */}
            <EscudoRibani className="h-7 w-7 shrink-0" />
            RIBANI
          </span>

          {(esAdmin ? itemsPanel : itemsPanelFamiliar).map(({ to, etiqueta, Icono, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={claseItem}
              onClick={onCerrar}
            >
              <Icono size={18} />
              {etiqueta}
            </NavLink>
          ))}

          {esAdmin && (
            <>
              <span className="px-3 pt-6 pb-2 text-xs font-medium text-pino-400">
                Administración
              </span>
              {itemsAdmin.map(({ to, etiqueta, Icono, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={claseItem}
                  onClick={onCerrar}
                >
                  <Icono size={18} />
                  {etiqueta}
                </NavLink>
              ))}
            </>
          )}
        </nav>
      </aside>
    </>
  )
}
