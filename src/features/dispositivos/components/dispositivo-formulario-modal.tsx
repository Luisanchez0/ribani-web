import { useState } from 'react'
import type { FormEvent } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useActualizarDispositivo, useRegistrarDispositivo } from '../hooks'
import type { components } from '@/types/api'
import type { Dispositivo } from '../types'

type DispositivoFormularioModalProps = {
  abierto: boolean
  dispositivoEditar: Dispositivo | null
  onCerrar: () => void
}

type CrearPlataforma = components['schemas']['CreateDispositivoDto']['plataforma']

const plataformas: Array<{ valor: CrearPlataforma; etiqueta: string }> = [
  { valor: 'ANDROID', etiqueta: 'Android' },
  { valor: 'IOS', etiqueta: 'iOS' },
  { valor: 'WEB', etiqueta: 'Web' },
]


export function DispositivoFormularioModal({
  abierto,
  dispositivoEditar,
  onCerrar,
}: DispositivoFormularioModalProps) {
  const registrar = useRegistrarDispositivo()
  const actualizar = useActualizarDispositivo()

  const mutacion = dispositivoEditar ? actualizar : registrar
  const enCurso = registrar.isPending || actualizar.isPending

  const [nombre, setNombre] = useState(dispositivoEditar?.nombre ?? '')
  const [plataforma, setPlataforma] = useState<string>(
    dispositivoEditar?.plataforma ?? '',
  )
  const [identificador, setIdentificador] = useState('')
  const [pushToken, setPushToken] = useState('')
  const [versionApp, setVersionApp] = useState(
    dispositivoEditar?.version_app ?? '',
  )

  if (!abierto) return null

  function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    if (dispositivoEditar) {
      actualizar.mutate(
        {
          id: dispositivoEditar.id,
          datos: {
            nombre: nombre.trim(),
            push_token: pushToken.trim() || undefined,
            version_app: versionApp.trim() || undefined,
          },
        },
        { onSuccess: onCerrar },
      )
      return
    }

    registrar.mutate(
      {
        nombre: nombre.trim(),
        plataforma: plataforma as CrearPlataforma,
        identificador: identificador.trim() || undefined,
        push_token: pushToken.trim() || undefined,
        version_app: versionApp.trim() || undefined,
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
        aria-labelledby="titulo-dispositivo-modal"
        className="relative w-full max-w-md rounded-lg border border-salvia-200 bg-white p-6 shadow-lg"
      >
        <h2
          id="titulo-dispositivo-modal"
          className="font-display text-lg font-semibold text-pino-900"
        >
          {dispositivoEditar ? 'Editar dispositivo' : 'Registrar dispositivo'}
        </h2>
        <p className="mt-1 text-sm/6 text-salvia-700">
          {dispositivoEditar
            ? `Modifica los datos de ${dispositivoEditar.nombre}.`
            : 'Registra el dispositivo desde el que se hace seguimiento.'}
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label
              htmlFor="dispositivo-nombre"
              className="block text-sm font-medium text-pino-900"
            >
              Nombre
            </label>
            <Input
              id="dispositivo-nombre"
              required
              placeholder="Celular de mamá…"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
            />
          </div>

          {!dispositivoEditar && (
            <div className="space-y-1.5">
              <label
                htmlFor="dispositivo-plataforma"
                className="block text-sm font-medium text-pino-900"
              >
                Plataforma
              </label>
              <select
                id="dispositivo-plataforma"
                required
                className="w-full rounded-md border border-salvia-300 bg-white px-3 py-2 text-sm text-pino-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600"
                value={plataforma}
                onChange={(evento) => setPlataforma(evento.target.value)}
              >
                <option value="" disabled>
                  Selecciona una plataforma
                </option>
                {plataformas.map(({ valor, etiqueta }) => (
                  <option key={valor} value={valor}>
                    {etiqueta}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!dispositivoEditar && (
            <div className="space-y-1.5">
              <label
                htmlFor="dispositivo-identificador"
                className="block text-sm font-medium text-pino-900"
              >
                Identificador{' '}
                <span className="text-salvia-500">(opcional)</span>
              </label>
              <Input
                id="dispositivo-identificador"
                placeholder="ID del dispositivo / serial"
                value={identificador}
                onChange={(evento) => setIdentificador(evento.target.value)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="dispositivo-push-token"
              className="block text-sm font-medium text-pino-900"
            >
              Push token <span className="text-salvia-500">(opcional)</span>
            </label>
            <Input
              id="dispositivo-push-token"
              value={pushToken}
              onChange={(evento) => setPushToken(evento.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="dispositivo-version"
              className="block text-sm font-medium text-pino-900"
            >
              Versión de la app{' '}
              <span className="text-salvia-500">(opcional)</span>
            </label>
            <Input
              id="dispositivo-version"
              placeholder="1.0.0"
              value={versionApp}
              onChange={(evento) => setVersionApp(evento.target.value)}
            />
          </div>

          {mutacion.isError && (
            <Alert variant="error">
              No se pudieron guardar los cambios. Revisa los datos e intenta de
              nuevo.
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={onCerrar} disabled={enCurso}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enCurso}>
              {enCurso ? (
                <Spinner
                  size="sm"
                  label={
                    dispositivoEditar
                      ? 'Guardando cambios…'
                      : 'Registrando dispositivo…'
                  }
                />
              ) : dispositivoEditar ? (
                'Guardar cambios'
              ) : (
                'Registrar'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
