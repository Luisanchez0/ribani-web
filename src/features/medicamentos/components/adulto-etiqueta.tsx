/**
 * Datos mínimos de un adulto mayor para identificarlo en la UI de
 * medicamentos. `indice` es su posición en GET /familiares/mis-adultos y
 * fija un color estable mientras la lista no cambie.
 */
export type InfoAdulto = {
  nombre: string
  indice: number
}

/** Rojo y ámbar quedan fuera: están reservados para estados (index.css). */
const colores = [
  'bg-pino-100 text-pino-800',
  'bg-sky-100 text-sky-800',
  'bg-violet-100 text-violet-800',
  'bg-salvia-200 text-salvia-800',
]

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Etiqueta del adulto al que pertenece un medicamento o una toma.
 * El nombre siempre es visible: el color solo ayuda a distinguirlos.
 */
export function AdultoEtiqueta({
  adulto,
  compacta = false,
  multilinea = false,
}: {
  adulto: InfoAdulto | undefined
  compacta?: boolean
  multilinea?: boolean
}) {
  if (!adulto) {
    return <span className="text-sm text-salvia-500">Adulto no disponible</span>
  }

  const color = colores[adulto.indice % colores.length]

  return (
    <span className="inline-flex max-w-full items-center gap-2">
      <span
        aria-hidden="true"
        className={`inline-grid shrink-0 place-content-center rounded-full font-semibold ${color} ${
          compacta ? 'h-5 w-5 text-[10px]' : 'h-7 w-7 text-xs'
        }`}
      >
        {iniciales(adulto.nombre)}
      </span>
      <span className={`${multilinea ? 'min-w-0 break-words' : 'truncate'} ${compacta ? 'text-xs' : 'text-sm'}`}>
        {adulto.nombre}
      </span>
    </span>
  )
}
