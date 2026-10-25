/**
 * API pública de la feature auth.
 * Otras features solo pueden importar desde aquí (ver AGENTS.md).
 */
export { LoginPage } from './pages/login-page'
export { DosPasosModal } from './components/dos-pasos-modal'
export { useLogin } from './hooks/use-login'
export { useLogout } from './hooks/use-logout'
export { AuthBootstrap } from './components/auth-bootstrap'
