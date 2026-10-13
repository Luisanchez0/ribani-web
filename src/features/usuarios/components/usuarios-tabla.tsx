import type { ComponentProps } from 'react'

import { Button } from '@/components/ui/button'
import { Td, Table, Th } from '@/components/ui/table'
import { formatFecha } from '@/lib/format'

import type { UsuarioLista } from '../types'

type BadgeProps = ComponentProps<'span'> & { activo: boolean }

/** Estado del usuario: no depender solo del color (ver AGENTS.md). */
function BadgeEstado({ activo, className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
        activo
          ? 'bg-pino-100 text-pino-800'
          : 'bg-salvia-100 text-salvia-600'
      } ${className}`}
      {...props}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${
          activo ? 'bg-pino-600' : 'bg-salvia-400'
        }`}
      />
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  )
}

type UsuariosTablaProps = {
  usuarios: UsuarioLista[]
  ocupados: Set<string>
  onEditar: (usuario: UsuarioLista) => void
  onAlternarActivo: (usuario: UsuarioLista) => void
  onEliminar: (usuario: UsuarioLista) => void
}

export function UsuariosTabla({
  usuarios,
  ocupados,
  onEditar,
  onAlternarActivo,
  onEliminar,
}: UsuariosTablaProps) {
  return (
    <Table>
      <thead>
        <tr>
          <Th>Nombre</Th>
          <Th>Correo electrónico</Th>
          <Th>Teléfono</Th>
          <Th>Rol</Th>
          <Th>Estado</Th>
          <Th>Último acceso</Th>
          <Th>
            <span className="sr-only">Acciones</span>
          </Th>
        </tr>
      </thead>
      <tbody>
        {usuarios.map((usuario) => {
          const ocupado = ocupados.has(usuario.id)

          return (
            <tr key={usuario.id} className="hover:bg-salvia-50">
              <Td className="font-medium">
                {usuario.nombre} {usuario.apellido}
              </Td>
              <Td>{usuario.email}</Td>
              <Td>{usuario.telefono ?? '—'}</Td>
              <Td>{usuario.rol_id}</Td>
              <Td>
                <BadgeEstado activo={usuario.activo} />
              </Td>
              <Td>
                {usuario.ultimo_acceso_en
                  ? formatFecha(usuario.ultimo_acceso_en)
                  : 'Nunca'}
              </Td>
              <Td className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={ocupado}
                    onClick={() => onEditar(usuario)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={ocupado}
                    onClick={() => onAlternarActivo(usuario)}
                  >
                    {usuario.activo ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={ocupado}
                    onClick={() => onEliminar(usuario)}
                  >
                    Eliminar
                  </Button>
                </div>
              </Td>
            </tr>
          )
        })}
      </tbody>
    </Table>
  )
}
