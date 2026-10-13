/**
 * Tipos de los íconos de reicon-react-native usados por la app.
 *
 * El paquete no expone `./icons/*` en su exports map, pero Vite resuelve
 * esas rutas mediante el plugin de vite.config.ts (imports por archivo
 * para tree-shaking). Con `moduleResolution: bundler`, TypeScript exige
 * esta declaración para aceptarlos.
 *
 * Importante: este archivo NO debe tener imports de nivel superior; con
 * ellos el `declare module` se interpretaría como augmentación de un
 * módulo existente y no como declaración ambiental de un patrón.
 */
declare module 'reicon-react-native/icons/*.js' {
  import type { ComponentType, CSSProperties } from 'react'

  type PropiedadesIcono = {
    size?: number
    color?: string
    weight?: 'Filled' | 'Outline'
    strokeWidth?: number | string
    secondaryColor?: string
    className?: string
    style?: CSSProperties
  }

  const Icono: ComponentType<PropiedadesIcono>
  export default Icono
}
