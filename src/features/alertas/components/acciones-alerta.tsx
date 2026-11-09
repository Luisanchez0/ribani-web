import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

import {
  useActualizarAlerta,
  useEliminarAlerta,
  type Alerta,
} from '../api/alertas.api'
import { accionesDisponibles } from '../utils/acciones-alerta'

function mensajeError(error: unknown) {
  const status =
    typeof error === 'object' && error !== null && 'response' in error &&
    typeof error.response === 'object' && error.response !== null &&
    'status' in error.response ? error.response.status : undefined

  if (status === 403) {
    return 'Tu cuenta no tiene permiso para actualizar alertas.'
  }
  if (status === 409) {
    return 'La alerta cambió de estado. Actualiza la lista antes de intentarlo de nuevo.'
  }
  return 'No se pudo actualizar la alerta. Intenta de nuevo.'
}

/** El backend valida permisos y transiciones; el origen solo describe la acción. */
export function AccionesAlerta({
  alerta,
  permitirEliminar = false,
  origen = 'administrador',
}: {
  alerta: Alerta
  permitirEliminar?: boolean
  origen?: 'administrador' | 'familiar'
}) {
  const actualizar = useActualizarAlerta()
  const eliminar = useEliminarAlerta()
  const ocupado = actualizar.isPending || eliminar.isPending
  const error = actualizar.error ?? eliminar.error

  return (
    <div className="space-y-2">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={`Acciones para ${alerta.titulo}`}
        aria-busy={ocupado}
      >
        {accionesDisponibles(alerta.estado).map((accion) => (
          <Button
            key={accion.estado}
            size="sm"
            variant={accion.estado === 'EN_ATENCION' ? 'primary' : 'secondary'}
            disabled={ocupado}
            onClick={() => {
              eliminar.reset()
              actualizar.mutate({
                id: alerta.id,
                cuerpo: {
                  estado: accion.estado,
                  detalle: `${accion.etiqueta}: acción del ${origen} desde la web.`,
                },
              })
            }}
          >
            {actualizar.isPending && actualizar.variables.cuerpo.estado === accion.estado
              ? 'Guardando…'
              : accion.etiqueta}
          </Button>
        ))}
        {permitirEliminar && (
          <Button
            variant="danger"
            size="sm"
            disabled={ocupado}
            onClick={() => {
              const confirmado = window.confirm(
                `¿Eliminar del historial la alerta "${alerta.titulo}"? La fila se conserva para auditoría.`,
              )
              if (!confirmado) return
              actualizar.reset()
              eliminar.mutate(alerta.id)
            }}
          >
            {eliminar.isPending ? 'Eliminando…' : 'Eliminar'}
          </Button>
        )}
      </div>
      {error && <Alert variant="error">{mensajeError(error)}</Alert>}
      {(actualizar.isSuccess || eliminar.isSuccess) && !error && (
        <p role="status" className="text-sm text-pino-700">
          {eliminar.isSuccess
            ? 'Alerta eliminada del historial.'
            : 'Estado de la alerta actualizado.'}
        </p>
      )}
    </div>
  )
}
