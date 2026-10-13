/**
 * Adaptador web para reicon-react-native (ver vite.config.ts).
 *
 * Los íconos de Reicon se construyen con su `createIcon`, que delega en
 * `react-native-svg` (componentes nativos, no disponibles en web).
 * Este módulo reemplaza SOLO el factory en tiempo de compilación y
 * renderiza el mismo markup SVG como DOM estándar, sin React Native.
 *
 * El contrato es idéntico al de `reicon-react-native/createIcon.js`:
 * props `size`, `color`, `weight`, `strokeWidth`, `secondaryColor`.
 * `currentColor` se conserva para heredar el color del texto (CSS).
 */
import { createElement, forwardRef } from 'react'
import type { CSSProperties } from 'react'

type PesoIcono = 'Filled' | 'Outline'

type PropiedadesIcono = {
  size?: number
  color?: string
  weight?: PesoIcono
  strokeWidth?: number | string
  secondaryColor?: string
  className?: string
  style?: CSSProperties
}

const MAPA_PESO: Record<PesoIcono, string> = { Filled: 'F', Outline: 'O' }

function crearIconoWeb(
  nombre: string,
  datos: Partial<Record<string, string>>,
) {
  const Icono = forwardRef<HTMLSpanElement, PropiedadesIcono>(
    (
      {
        size = 24,
        color,
        weight = 'Outline',
        strokeWidth,
        secondaryColor,
        className,
        style,
      },
      ref,
    ) => {
      const clave = MAPA_PESO[weight] ?? 'O'
      let contenido =
        datos[clave] ?? datos[Object.keys(datos)[0] ?? ''] ?? ''

      if (strokeWidth != null) {
        contenido = contenido.replace(
          /stroke-width="[^"]*"/g,
          `stroke-width="${strokeWidth}"`,
        )
      }

      if (color != null) {
        contenido = contenido.replaceAll('currentColor', color)
      }

      if (secondaryColor != null) {
        contenido = contenido.replaceAll('__RI_SECONDARY__', secondaryColor)
      }

      const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"` +
        ` viewBox="0 0 24 24" fill="none" aria-hidden="true">${contenido}</svg>`

      return createElement('span', {
        ref,
        className,
        style,
        dangerouslySetInnerHTML: { __html: svg },
      })
    },
  )

  Icono.displayName = nombre
  return Icono
}

export default crearIconoWeb
