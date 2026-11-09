import { useAuthStore } from '@/stores/auth-store'

import { PanelAdminPage } from './panel-admin-page'
import { PanelFamiliarPage } from './panel-familiar-page'

export function PanelPage() {
  const rol = useAuthStore(state => state.usuario?.rol.codigo)
  return rol === 'ADMINISTRADOR' ? <PanelAdminPage /> : <PanelFamiliarPage />
}
