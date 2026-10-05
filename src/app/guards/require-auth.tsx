import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/stores/auth-store'

/**
 * Protege las rutas que requieren sesión activa.
 *
 * El guard solo mejora la UX: la autenticación y autorización reales
 * las valida el backend en cada request (ver AGENTS.md).
 */
export function RequireAuth() {
  const token = useAuthStore((state) => state.token)
  const location = useLocation()

  if (!token) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    )
  }

  return <Outlet />
}
