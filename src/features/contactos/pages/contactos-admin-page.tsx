import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Td, Table, Th } from '@/components/ui/table'
import { IconoContactos } from '@/lib/iconos'
import {
  ANCHO_LARGO,
  ANCHO_NORMAL,
  BARRA_FILTROS,
  CONTROL_FILTRO,
} from '@/lib/clases-filtros'
import { useAdultos } from '@/features/usuarios'

import { useContactos } from '../hooks'
import type { Contacto } from '../types'

/**
 * Contactos de emergencia (/admin/contactos, solo ADMINISTRADOR): vista de
 * solo lectura de TODOS los contactos de emergencia del sistema, agrupados
 * por adulto mayor. La gestión sigue en el panel del familiar.
 */
export function ContactosAdminPage() {
  const contactos = useContactos()
  const adultos = useAdultos()

  const [adultoSel, setAdultoSel] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const nombreAdulto = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const a of adultos.data ?? []) {
      mapa.set(a.id, `${a.nombre} ${a.apellido}`)
    }
    return mapa
  }, [adultos.data])

  /**
   * Filtrado cliente (GET /contactos no soporta búsqueda de texto):
   * por adulto y por nombre/teléfono/email con texto.
   */
  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return (contactos.data ?? []).filter((c) => {
      if (adultoSel && c.adulto_id !== adultoSel) return false
      if (
        texto &&
        !`${c.nombre} ${c.telefono} ${c.email ?? ''}`
          .toLowerCase()
          .includes(texto)
      )
        return false
      return true
    })
  }, [contactos.data, adultoSel, busqueda])

  /** Agrupa por adulto_id preservando la prioridad del backend. */
  const porAdulto = useMemo(() => {
    const grupos = new Map<string, Contacto[]>()
    for (const contacto of filtrados) {
      const lista = grupos.get(contacto.adulto_id) ?? []
      lista.push(contacto)
      grupos.set(contacto.adulto_id, lista)
    }
    return grupos
  }, [filtrados])

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-pino-900">
          <IconoContactos size={24} className="text-pino-600" />
          Contactos de emergencia
        </h1>
      </div>

      {/* Filtros: adulto y búsqueda de texto */}
      <div className={BARRA_FILTROS}>
        <div>
          <label
            htmlFor="filtro-con-adulto"
            className="text-xs font-medium text-salvia-600"
          >
            Adulto
          </label>
          <select
            id="filtro-con-adulto"
            value={adultoSel}
            onChange={(e) => setAdultoSel(e.target.value)}
            className={`${CONTROL_FILTRO} ${ANCHO_LARGO}`}
          >
            <option value="">Todos</option>
            {(adultos.data ?? []).map((adulto) => (
              <option key={adulto.id} value={adulto.id}>
                {adulto.nombre} {adulto.apellido}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="filtro-con-buscar"
            className="text-xs font-medium text-salvia-600"
          >
            Buscar
          </label>
          <input
            id="filtro-con-buscar"
            type="search"
            placeholder="Nombre, teléfono o correo…"
            className={`${CONTROL_FILTRO} ${ANCHO_NORMAL}`}
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
          />
        </div>
      </div>

      <p className="max-w-2xl text-sm/6 text-salvia-700">
        Todos los contactos de emergencia del sistema, agrupados por adulto
        mayor. Quien recibe las alertas críticas por WhatsApp de cada persona.
      </p>

      <div className="rounded-lg border border-salvia-200 bg-white shadow-sm">
        {contactos.isPending ? (
          <div className="flex items-center justify-center gap-3 p-10 text-sm text-salvia-600">
            <Spinner size="sm" label="Cargando contactos" />
            Cargando contactos…
          </div>
        ) : contactos.isError ? (
          <div className="space-y-3 p-6">
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            >
              No se pudieron cargar los contactos. Verifica tu conexión e
              intenta de nuevo.
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void contactos.refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-pino-900">
              {(contactos.data ?? []).length === 0
                ? 'No hay contactos de emergencia'
                : 'Ningún contacto coincide con los filtros'}
            </p>
            <p className="mt-1 text-sm text-salvia-600">
              {(contactos.data ?? []).length === 0
                ? 'Los contactos aparecen cuando el familiar de cada adulto los registra desde su panel.'
                : 'Limpia la búsqueda para ver más resultados.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-salvia-100">
            {[...porAdulto.entries()].map(([adultoId, lista]) => (
              <div key={adultoId}>
                <h2 className="bg-salvia-50 px-4 py-2 text-sm font-semibold text-pino-900">
                  {nombreAdulto.get(adultoId) ?? adultoId}{' '}
                  <span className="font-normal text-salvia-600">
                    ({lista.length} contacto{lista.length === 1 ? '' : 's'})
                  </span>
                </h2>
                <Table>
                  <thead>
                    <tr>
                      <Th>Nombre</Th>
                      <Th>Parentesco</Th>
                      <Th>Teléfono</Th>
                      <Th>Correo</Th>
                      <Th>Prioridad</Th>
                      <Th>Estado</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((contacto) => (
                      <tr key={contacto.id} className="hover:bg-salvia-50">
                        <Td className="font-medium">{contacto.nombre}</Td>
                        <Td>{contacto.parentesco ?? '—'}</Td>
                        <Td>{contacto.telefono}</Td>
                        <Td>{contacto.email ?? '—'}</Td>
                        <Td>{contacto.prioridad}</Td>
                        <Td>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              contacto.activo
                                ? 'bg-pino-100 text-pino-800'
                                : 'bg-salvia-100 text-salvia-600'
                            }`}
                          >
                            {contacto.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
