import { Navigate, Route, Routes } from 'react-router-dom'

import { Shell } from '@/components/layout/shell'
import { AlertasAdminPage } from '@/features/alertas'
import { AlertasPage } from '@/features/alertas'
import { AuditoriaPage } from '@/features/auditoria'
import { LoginPage } from '@/features/auth'
import { ContactosAdminPage } from '@/features/contactos'
import { ContactosPage } from '@/features/contactos'
import { DispositivosPage } from '@/features/dispositivos'
import { FamiliaresPage } from '@/features/familiares'
import { RelacionesAdminPage } from '@/features/familiares'
import { MedicamentosAdminPage } from '@/features/medicamentos'
import { MedicamentosPage } from '@/features/medicamentos'
import { PanelPage } from '@/features/panel'
import { RolesPage } from '@/features/roles'
import { UbicacionesPage } from '@/features/ubicaciones'
import { UbicacionesAdminPage } from '@/features/ubicaciones'
import { UsuariosPage } from '@/features/usuarios'
import { ZonasSegurasPage } from '@/features/zonas-seguras'

import { RequireAuth } from './guards/require-auth'
import { RequireRole, ROL_ADMINISTRADOR } from './guards/require-role'

/**
 * Único lugar donde se definen las rutas (ver AGENTS.md):
 *   /panel/*  → vista familiar / seguimiento diario
 *   /admin/*  → administración del sistema
 */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/*
        Zona /panel: seguimiento diario del familiar/adulto. TODAS las
        rutas existen (el menú del admin las oculta para evitar duplicados,
        pero son funcionales si se navega directo o con rol familiar).
      */}
      <Route path="/panel" element={<RequireAuth />}>
        <Route element={<Shell />}>
          <Route index element={<PanelPage />} />
          <Route path="ubicaciones" element={<UbicacionesPage />} />
          <Route path="alertas" element={<AlertasPage />} />
          <Route path="zonas-seguras" element={<ZonasSegurasPage />} />
          <Route path="medicamentos" element={<MedicamentosPage />} />
          <Route path="contactos" element={<ContactosPage />} />
          <Route path="dispositivos" element={<DispositivosPage />} />
          <Route path="familiares" element={<FamiliaresPage />} />
        </Route>
      </Route>

      <Route path="/admin" element={<RequireAuth />}>
        <Route
          element={<RequireRole roles={[ROL_ADMINISTRADOR]} />}
        >
          <Route element={<Shell />}>
            <Route index element={<Navigate to="/admin/usuarios" replace />} />
            <Route path="usuarios" element={<UsuariosPage />} />
            <Route path="ubicaciones" element={<UbicacionesAdminPage />} />
            <Route path="relaciones" element={<RelacionesAdminPage />} />
            <Route path="alertas" element={<AlertasAdminPage />} />
            <Route path="medicamentos" element={<MedicamentosAdminPage />} />
            <Route path="contactos" element={<ContactosAdminPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="auditoria" element={<AuditoriaPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/panel" replace />} />
    </Routes>
  )
}
