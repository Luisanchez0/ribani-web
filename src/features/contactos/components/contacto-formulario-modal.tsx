import { useState } from 'react'
import type { FormEvent } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { PAISES_TELEFONO } from '@/features/auth/datos/paises-telefono'
import { useActualizarContacto, useAdultosVinculados, useCrearContacto } from '../hooks'
import type { Contacto } from '../types'

type ContactoFormularioModalProps = {
  abierto: boolean
  /** Contacto a editar; null = modo creación. */
  contactoEditar: Contacto | null
  onCerrar: () => void
}


export function ContactoFormularioModal({
  abierto,
  contactoEditar,
  onCerrar,
}: ContactoFormularioModalProps) {
  const crear = useCrearContacto()
  const actualizar = useActualizarContacto()
  const adultos = useAdultosVinculados()

  const mutacion = contactoEditar ? actualizar : crear
  const enCurso = crear.isPending || actualizar.isPending

  const [adultoId, setAdultoId] = useState('')
  const [nombre, setNombre] = useState(contactoEditar?.nombre ?? '')
  const [parentesco, setParentesco] = useState(contactoEditar?.parentesco ?? '')
  // La BD guarda E.164 (+52, +51...); al editar separamos código y número.
  const [codigoPais, setCodigoPais] = useState(() => {
    const guardado = contactoEditar?.telefono ?? ''
    return PAISES_TELEFONO.find((pais) => guardado.startsWith(pais.codigo))?.codigo ?? ''
  })
  const [telefono, setTelefono] = useState(() => {
    const guardado = contactoEditar?.telefono ?? ''
    const codigo = PAISES_TELEFONO.find((pais) => guardado.startsWith(pais.codigo))?.codigo
    return codigo ? guardado.slice(codigo.length) : guardado
  })
  const [email, setEmail] = useState(contactoEditar?.email ?? '')
  const [prioridad, setPrioridad] = useState(
    contactoEditar ? String(contactoEditar.prioridad) : '1',
  )

  if (!abierto) return null

  function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    const telefonoE164 = `${codigoPais}${telefono.replace(/\D/g, '')}`

    if (contactoEditar) {
      actualizar.mutate(
        {
          id: contactoEditar.id,
          datos: {
            nombre: nombre.trim(),
            parentesco: parentesco.trim() || undefined,
            telefono: telefonoE164,
            email: email.trim() || undefined,
            prioridad: Number(prioridad),
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
        parentesco: parentesco.trim() || undefined,
        telefono: telefonoE164,
        email: email.trim() || undefined,
        prioridad: Number(prioridad),
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
        aria-labelledby="titulo-contacto-modal"
        className="relative w-full max-w-md rounded-lg border border-salvia-200 bg-white p-6 shadow-lg"
      >
        <h2
          id="titulo-contacto-modal"
          className="font-display text-lg font-semibold text-pino-900"
        >
          {contactoEditar ? 'Editar contacto' : 'Nuevo contacto'}
        </h2>
        <p className="mt-1 text-sm/6 text-salvia-700">
          {contactoEditar
            ? `Modifica los datos de ${contactoEditar.nombre}.`
            : 'Agrega un contacto de emergencia del adulto mayor.'}
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {!contactoEditar && (
            <div className="space-y-1.5">
              <label
                htmlFor="contacto-adulto"
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
                  id="contacto-adulto"
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
              htmlFor="contacto-nombre"
              className="block text-sm font-medium text-pino-900"
            >
              Nombre
            </label>
            <Input
              id="contacto-nombre"
              required
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="contacto-parentesco"
                className="block text-sm font-medium text-pino-900"
              >
                Parentesco <span className="text-salvia-500">(opcional)</span>
              </label>
              <Input
                id="contacto-parentesco"
                placeholder="Hijo/a, vecino…"
                value={parentesco}
                onChange={(evento) => setParentesco(evento.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="contacto-prioridad"
                className="block text-sm font-medium text-pino-900"
              >
                Prioridad
              </label>
              <Input
                id="contacto-prioridad"
                type="number"
                min={1}
                max={10}
                required
                value={prioridad}
                onChange={(evento) => setPrioridad(evento.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="contacto-telefono"
              className="block text-sm font-medium text-pino-900"
            >
              Teléfono
            </label>
            <div className="flex gap-2">
              <select
                id="contacto-codigo-pais"
                aria-label="Código de país"
                className="w-auto shrink-0 rounded-md border border-salvia-300 bg-white px-2 py-2 text-sm text-pino-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600"
                value={codigoPais}
                onChange={(evento) => setCodigoPais(evento.target.value)}
              >
                {PAISES_TELEFONO.map((pais) => (
                  <option key={pais.codigo} value={pais.codigo}>
                    {pais.bandera} {pais.codigo}
                  </option>
                ))}
              </select>
              <Input
                id="contacto-telefono"
                type="tel"
                autoComplete="tel-national"
                inputMode="tel"
                placeholder="300 123 4567"
                required
                value={telefono}
                onChange={(evento) => setTelefono(evento.target.value)}
              />
            </div>
            <p className="text-xs text-salvia-600">
              Se guarda con el código de país para poder llamar en emergencias.
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="contacto-email"
              className="block text-sm font-medium text-pino-900"
            >
              Correo electrónico{' '}
              <span className="text-salvia-500">(opcional)</span>
            </label>
            <Input
              id="contacto-email"
              type="email"
              autoComplete="off"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
            />
          </div>

          {mutacion.isError && (
            <Alert variant="error">
              No se pudieron guardar los cambios. Verifica que el teléfono
              tenga entre 7 y 15 dígitos junto al código de país (formato
              internacional, ej. +52 55 1234 5678) e intenta de nuevo.
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={onCerrar}
              disabled={enCurso}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={enCurso}>
              {enCurso ? (
                <Spinner
                  size="sm"
                  label={
                    contactoEditar ? 'Guardando cambios…' : 'Creando contacto…'
                  }
                />
              ) : contactoEditar ? (
                'Guardar cambios'
              ) : (
                'Crear contacto'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
