import { useEffect } from 'react'

import L from 'leaflet'
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'

import { esCoordenadaValida, formatFechaHora } from '@/lib/format'

import type { Ubicacion, UbicacionResumenAdulto } from '../types'

import 'leaflet/dist/leaflet.css'


const iconoAdulto = L.divIcon({
  className: '',
  html: `
    <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ubicación del adulto">
      <circle cx="18" cy="18" r="10" fill="#166534" opacity="0.25"/>
      <circle cx="18" cy="18" r="7" fill="#166534"/>
      <circle cx="18" cy="18" r="3" fill="#ffffff"/>
    </svg>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

type MapaUbicacionProps = {
  /** Última ubicación a pintar (cache actual o stream). */
  ubicacion: Ubicacion | null
  /** Seguir automáticamente al adulto cuando llega un reporte nuevo. */
  seguir: boolean
  onSeguirChange: (seguir: boolean) => void
}

/** Recentrar el mapa cuando cambia la ubicación y el modo seguimiento está activo. */
function SeguirCentro({
  latitud,
  longitud,
  activo,
}: {
  latitud: number
  longitud: number
  activo: boolean
}) {
  const map = useMap()

  useEffect(() => {
    if (activo) {
      map.setView([latitud, longitud], map.getZoom(), { animate: true })
    }
  }, [activo, latitud, longitud, map])

  return null
}

/**
 * Mapa OpenStreetMap con la ubicación del adulto mayor (AGENTS.md:
 * react-leaflet + OpenStreetMap; coordenadas validadas antes de
 * renderizar; sin API keys).
 */
export function MapaUbicacion({
  ubicacion,
  seguir,
  onSeguirChange,
}: MapaUbicacionProps) {
  const valida =
    ubicacion !== null &&
    esCoordenadaValida(ubicacion.latitud, ubicacion.longitud)

  return (
    <div className="relative h-96 w-full overflow-hidden rounded-lg border border-salvia-200">
      <MapContainer
        center={[CENTRO_DEFECTO.lat, CENTRO_DEFECTO.lng]}
        zoom={12}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {valida && ubicacion && (
          <>
            <Marker
              position={[ubicacion.latitud, ubicacion.longitud]}
              icon={iconoAdulto}
              alt="Ubicación del adulto mayor"
            />
            {ubicacion.precision_metros !== null &&
              ubicacion.precision_metros > 0 && (
                <Circle
                  center={[ubicacion.latitud, ubicacion.longitud]}
                  radius={ubicacion.precision_metros}
                  pathOptions={{
                    color: '#166534',
                    fillColor: '#166534',
                    fillOpacity: 0.08,
                    weight: 1,
                  }}
                />
              )}
            <SeguirCentro
              latitud={ubicacion.latitud}
              longitud={ubicacion.longitud}
              activo={seguir}
            />
          </>
        )}
      </MapContainer>

      {/* Centrar de nuevo en el adulto: visible cuando el usuario se aleja */}
      {valida && (
        <button
          type="button"
          onClick={() => {
            onSeguirChange(true)
          }}
          className="absolute bottom-3 right-3 z-[400] rounded-md border border-salvia-300 bg-white px-3 py-1.5 text-xs font-medium text-pino-900 shadow-sm hover:bg-salvia-50"
        >
          Centrar en el adulto
        </button>
      )}

      {!valida && (
        <div className="absolute inset-0 z-[400] flex items-center justify-center bg-salvia-50/80 text-sm text-salvia-700">
          Aún no hay una ubicación válida para mostrar en el mapa.
        </div>
      )}
    </div>
  )
}

/** Encaja la vista para que entren todos los marcadores (uno o varios). */
function AjustarVista({ adultos }: { adultos: UbicacionResumenAdulto[] }) {
  const map = useMap()
  // Firma estable: el array cambia de identidad en cada render.
  const firma = adultos
    .map((a) => `${a.adulto_id}:${a.latitud},${a.longitud}`)
    .join('|')

  useEffect(() => {
    if (!firma) return
    const puntos = adultos.map(
      (a) => [a.latitud, a.longitud] as [number, number],
    )
    if (puntos.length === 1) {
      map.setView(puntos[0], 15)
      return
    }
    map.fitBounds(puntos, { padding: [40, 40] })
    // firma resume adultos + coordenadas; evita reencuadrar en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firma, map])

  return null
}

type MapaAdultosProps = {
  /** Última ubicación por adulto (GET /ubicaciones/ultimas, solo admin). */
  adultos: UbicacionResumenAdulto[]
}

/**
 * Mapa con TODOS los adultos a la vez: un marcador por adulto con su nombre y
 * la hora del último reporte. La vista se ajusta a los marcadores existentes.
 */
export function MapaAdultos({ adultos }: MapaAdultosProps) {
  const validas = adultos.filter((a) =>
    esCoordenadaValida(a.latitud, a.longitud),
  )

  return (
    <div className="relative h-96 w-full overflow-hidden rounded-lg border border-salvia-200">
      <MapContainer
        center={[CENTRO_DEFECTO.lat, CENTRO_DEFECTO.lng]}
        zoom={12}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <AjustarVista adultos={validas} />
        {validas.map((adulto) => (
          <Marker
            key={adulto.adulto_id}
            position={[adulto.latitud, adulto.longitud]}
            icon={iconoAdulto}
            alt={`Ubicación de ${adulto.nombre} ${adulto.apellido}`}
          >
            <Popup>
              <strong>
                {adulto.nombre} {adulto.apellido}
              </strong>
              <br />
              {formatFechaHora(adulto.registrada_en)}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {validas.length === 0 && (
        <div className="absolute inset-0 z-[400] flex items-center justify-center bg-salvia-50/80 px-4 text-center text-sm text-salvia-700">
          Ningún adulto ha reportado una ubicación válida todavía.
        </div>
      )}
    </div>
  )
}

/** Fallback de centrado (CDMX) mientras no hay ubicación válida. */
const CENTRO_DEFECTO = { lat: 19.4326, lng: -99.1332 }
