import { useEffect } from 'react'

import L from 'leaflet'
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'

import { esCoordenadaValida } from '@/lib/format'

import 'leaflet/dist/leaflet.css'

/** Fallback de centrado (CDMX) cuando aún no hay un punto elegido. */
const CENTRO_DEFECTO = { lat: 19.4326, lng: -99.1332 }

const iconoCentro = L.divIcon({
  className: '',
  html: `
    <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Centro de la zona">
      <circle cx="14" cy="14" r="11" fill="#166534"/>
      <circle cx="14" cy="14" r="4" fill="#ffffff"/>
    </svg>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

type SelectorZonaMapaProps = {
  latitud: number | null
  longitud: number | null
  radioMetros: number | null
  /** Última ubicación del adulto: el mapa se centra ahí si no hay punto elegido. */
  referenciaLatitud: number | null
  referenciaLongitud: number | null
  onSeleccionar: (latitud: number, longitud: number) => void
}

/** Centra el mapa en la ubicación del adulto mientras no se haya elegido un punto. */
function CentrarEnReferencia({
  latitud,
  longitud,
  activa,
}: {
  latitud: number | null
  longitud: number | null
  activa: boolean
}) {
  const map = useMap()

  useEffect(() => {
    if (!activa || latitud === null || longitud === null) return
    map.setView([latitud, longitud], 16)
  }, [activa, latitud, longitud, map])

  return null
}

/** Captura clics en el mapa para elegir el centro de la zona. */
function CapturaClic({
  onSeleccionar,
}: {
  onSeleccionar: (latitud: number, longitud: number) => void
}) {
  useMapEvents({
    click(evento) {
      onSeleccionar(evento.latlng.lat, evento.latlng.lng)
    },
  })
  return null
}

/** Mueve la vista solo si el punto elegido queda fuera del área visible. */
function AjustarVista({
  latitud,
  longitud,
}: {
  latitud: number | null
  longitud: number | null
}) {
  const map = useMap()

  useEffect(() => {
    if (latitud === null || longitud === null) return
    const punto = L.latLng(latitud, longitud)
    if (!map.getBounds().contains(punto)) {
      map.panTo(punto)
    }
  }, [latitud, longitud, map])

  return null
}

/**
 * Selector de centro de zona segura sobre OpenStreetMap. Clic en el mapa o
 * arrastrar el marcador actualiza latitud y longitud del formulario.
 */
export function SelectorZonaMapa({
  latitud,
  longitud,
  radioMetros,
  referenciaLatitud,
  referenciaLongitud,
  onSeleccionar,
}: SelectorZonaMapaProps) {
  const hayPunto =
    latitud !== null &&
    longitud !== null &&
    esCoordenadaValida(latitud, longitud)

  const hayReferencia =
    referenciaLatitud !== null &&
    referenciaLongitud !== null &&
    esCoordenadaValida(referenciaLatitud, referenciaLongitud)

  const centro = hayPunto
    ? { lat: latitud, lng: longitud }
    : hayReferencia
      ? { lat: referenciaLatitud, lng: referenciaLongitud }
      : CENTRO_DEFECTO

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-pino-900">
        Centro de la zona
      </p>
      <div className="relative h-56 w-full overflow-hidden rounded-md border border-salvia-300">
        <MapContainer
          center={[centro.lat, centro.lng]}
          zoom={hayPunto || hayReferencia ? 16 : 13}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <CapturaClic onSeleccionar={onSeleccionar} />
          <AjustarVista latitud={latitud} longitud={longitud} />
          <CentrarEnReferencia
            latitud={referenciaLatitud}
            longitud={referenciaLongitud}
            activa={!hayPunto}
          />
          {hayPunto && (
            <>
              {radioMetros !== null && radioMetros > 0 && (
                <Circle
                  center={[latitud, longitud]}
                  radius={radioMetros}
                  pathOptions={{
                    color: '#166534',
                    fillColor: '#166534',
                    fillOpacity: 0.12,
                    weight: 2,
                  }}
                />
              )}
              <Marker
                position={[latitud, longitud]}
                icon={iconoCentro}
                draggable
                eventHandlers={{
                  dragend(evento) {
                    const punto = evento.target.getLatLng()
                    onSeleccionar(punto.lat, punto.lng)
                  },
                }}
              />
            </>
          )}
        </MapContainer>
      </div>
      <p className="text-xs text-salvia-600">
        Haz clic en el mapa o arrastra el marcador para elegir el centro.
      </p>
    </div>
  )
}
