import { useState } from 'react'
import type { FormEvent } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useAdultosVinculados } from '@/features/contactos'
import { useActualizarMedicamento, useCrearMedicamento } from '../hooks'
import type { Medicamento } from '../types'

type MedicamentoFormularioModalProps = {
  abierto: boolean
  /** Medicamento a editar; null = modo creación. */
  medicamentoEditar: Medicamento | null
  onCerrar: () => void
}

/**
 * Modal de creación/edición de medicamento. La validación respeta el
 * contrato del backend (CreateMedicamentoDto / UpdateMedicamentoDto);
 * la autorización real siempre es del server.
 *
 * El estado se inicializa perezosamente desde props y el padre remonta
 * el componente con una key distinta por medicamento (resetear estado
 * vía key, https://react.dev/learn/you-might-not-need-an-effect).
 */
export function MedicamentoFormularioModal({
  abierto,
  medicamentoEditar,
  onCerrar,
}: MedicamentoFormularioModalProps) {
  const crear = useCrearMedicamento()
  const actualizar = useActualizarMedicamento()
  const adultos = useAdultosVinculados()

  const mutacion = medicamentoEditar ? actualizar : crear
  const enCurso = crear.isPending || actualizar.isPending

  const [
    adultoId,
    setAdultoId,
  ] = useState(medicamentoEditar?.adulto_id ?? '')
  const [nombre, setNombre] = useState(medicamentoEditar?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(
    medicamentoEditar?.descripcion ?? '',
  )
  const [dosis, setDosis] = useState(
    medicamentoEditar ? String(medicamentoEditar.dosis) : '',
  )
  const [unidadDosis, setUnidadDosis] = useState(
    medicamentoEditar?.unidad_dosis ?? '',
  )
  const [instrucciones, setInstrucciones] = useState(
    medicamentoEditar?.instrucciones ?? '',
  )
  const [fechaInicio, setFechaInicio] = useState(
    medicamentoEditar ? medicamentoEditar.fecha_inicio.slice(0, 10) : '',
  )
  const [fechaFin, setFechaFin] = useState(
    medicamentoEditar?.fecha_fin ? medicamentoEditar.fecha_fin.slice(0, 10) : '',
  )

  if (!abierto) return null

  function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    if (medicamentoEditar) {
      actualizar.mutate(
        {
          id: medicamentoEditar.id,
          datos: {
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || undefined,
            dosis: Number(dosis),
            unidad_dosis: unidadDosis.trim(),
            instrucciones: instrucciones.trim() || undefined,
            fecha_inicio: fechaInicio,
            // Solo enviar fecha_fin si hay una; vacío = mantener la actual.
            ...(fechaFin ? { fecha_fin: fechaFin } : {}),
          },
        },
        { onSuccess: onCerrar },
      )
      return
    }

    crear.mutate(
      {
        adulto_id: adultoId,
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        dosis: Number(dosis),
        unidad_dosis: unidadDosis.trim(),
        instrucciones: instrucciones.trim() || undefined,
        fecha_inicio: fechaInicio,
        ...(fechaFin ? { fecha_fin: fechaFin } : {}),
      },
      { onSuccess: onCerrar },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar formulario"
        className="absolute inset-0 cursor-default bg-pino-950/60"
        onClick={onCerrar}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-medicamento-modal"
        className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-lg border border-salvia-200 bg-white p-6 shadow-lg"
      >
        <h2
          id="titulo-medicamento-modal"
          className="font-display text-lg font-semibold text-pino-900"
        >
          {medicamentoEditar ? 'Editar medicamento' : 'Nuevo medicamento'}
        </h2>
        <p className="mt-1 text-sm/6 text-salvia-700">
          {medicamentoEditar
            ? `Modifica los datos de ${medicamentoEditar.nombre}.`
            : 'Agrega un medicamento del adulto mayor.'}
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {!medicamentoEditar && (
            <div className="space-y-1.5">
              <label
                htmlFor="medicamento-adulto"
                className="block text-sm font-medium text-pino-900"
              >
                Adulto mayor
              </label>
              {adultos.isPending ? (
                <div className="flex items-center gap-3 py-2 text-sm text-salvia-600">
                  <Spinner size="sm" label="Cargando adultos" />
                  Cargando adultos…
                </div>
              ) : adultos.isError ? (
                <Alert variant="error">
                  No se pudo cargar la lista de adultos mayores.
                </Alert>
              ) : adultos.data.length === 0 ? (
                <Alert variant="info">
                  No tienes adultos mayores vinculados todavía.
                </Alert>
              ) : (
                <select
                  id="medicamento-adulto"
                  required
                  className="w-full rounded-md border border-salvia-300 bg-white px-3 py-2 text-sm text-pino-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600"
                  value={adultoId}
                  onChange={(evento) => setAdultoId(evento.target.value)}
                >
                  <option value="" disabled>
                    Selecciona un adulto mayor
                  </option>
                  {adultos.data.map((adulto) => (
                    <option key={adulto.id} value={adulto.id}>
                      {adulto.nombre} {adulto.apellido}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="medicamento-nombre"
              className="block text-sm font-medium text-pino-900"
            >
              Nombre
            </label>
            <Input
              id="medicamento-nombre"
              required
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="medicamento-dosis"
                className="block text-sm font-medium text-pino-900"
              >
                Cantidad por toma
              </label>
              <Input
                id="medicamento-dosis"
                type="number"
                min="0"
                step="0.001"
                required
                placeholder="500"
                value={dosis}
                onChange={(evento) => setDosis(evento.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="medicamento-unidad"
                className="block text-sm font-medium text-pino-900"
              >
                Unidad
              </label>
              <Input
                id="medicamento-unidad"
                required
                placeholder="mg, ml, comprimido…"
                value={unidadDosis}
                onChange={(evento) => setUnidadDosis(evento.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="medicamento-descripcion"
              className="block text-sm font-medium text-pino-900"
            >
              Descripción <span className="text-salvia-500">(opcional)</span>
            </label>
            <Input
              id="medicamento-descripcion"
              value={descripcion}
              onChange={(evento) => setDescripcion(evento.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="medicamento-instrucciones"
              className="block text-sm font-medium text-pino-900"
            >
              Instrucciones <span className="text-salvia-500">(opcional)</span>
            </label>
            <Input
              id="medicamento-instrucciones"
              placeholder="Con alimentos, cada 8 horas…"
              value={instrucciones}
              onChange={(evento) => setInstrucciones(evento.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="medicamento-fecha-inicio"
                className="block text-sm font-medium text-pino-900"
                title="Día en que empieza el tratamiento"
              >
                Fecha de inicio
              </label>
              <Input
                id="medicamento-fecha-inicio"
                type="date"
                required
                value={fechaInicio}
                onChange={(evento) => setFechaInicio(evento.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="medicamento-fecha-fin"
                className="block text-sm font-medium text-pino-900"
                title="Último día del tratamiento; sin fecha, el medicamento sigue activo indefinidamente"
              >
                Fecha de fin <span className="text-salvia-500">(opcional)</span>
              </label>
              <Input
                id="medicamento-fecha-fin"
                type="date"
                value={fechaFin}
                onChange={(evento) => setFechaFin(evento.target.value)}
              />
            </div>
          </div>

          {mutacion.isError && (
            <Alert variant="error">
              No se pudieron guardar los cambios. Revisa los datos e intenta de
              nuevo.
            </Alert>
          )}

          <p className="text-xs text-salvia-600">
            Los <span className="font-medium text-pino-900">horarios</span>{' '}
            (¿a qué horas se toma?) se configuran después, en la columna
            “Horarios” de la tabla.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={onCerrar} disabled={enCurso}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enCurso}>
              {enCurso ? (
                <Spinner
                  size="sm"
                  label={
                    medicamentoEditar
                      ? 'Guardando cambios…'
                      : 'Creando medicamento…'
                  }
                />
              ) : medicamentoEditar ? (
                'Guardar cambios'
              ) : (
                'Crear medicamento'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
