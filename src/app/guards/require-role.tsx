import { Navigate, Outlet } from 'react-router-dom'

import { useAuthStore } from '@/stores/auth-store'

/** Código del rol administrativo según el seed del backend (prisma/seed-admin.ts). */
export const ROL_ADMINISTRADOR = 'ADMINISTRADOR'

type RequireRoleProps = {
  roles: string[]
}

/**
 * Restringe el acceso a usuarios con uno de los roles indicados.
 * Igual que RequireAuth: frontera de UX, no de seguridad.
 */
export function RequireRole({ roles }: RequireRoleProps) {
  const usuario = useAuthStore((state) => state.usuario)

  if (!usuario || !roles.includes(usuario.rol.codigo)) {
    return <Navigate to="/panel" replace />
  }

  return <Outlet />
}
