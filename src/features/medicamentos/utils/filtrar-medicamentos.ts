import type { Medicamento } from '../types'

export type EstadoFiltroMedicamentos = 'todos' | 'activos' | 'inactivos'

function normalizarBusqueda(texto: string): string {
  return texto.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es-MX').trim()
}

export function filtrarMedicamentos(
  medicamentos: Medicamento[],
  busqueda: string,
  estado: EstadoFiltroMedicamentos,
  nombresAdultos: Map<string, string>,
): Medicamento[] {
  const texto = normalizarBusqueda(busqueda)
  return medicamentos.filter(medicamento => {
    if (estado === 'activos' && !medicamento.activo) return false
    if (estado === 'inactivos' && medicamento.activo) return false
    if (!texto) return true
    const contenido = `${medicamento.nombre} ${medicamento.instrucciones ?? ''} ${nombresAdultos.get(medicamento.adulto_id) ?? ''}`
    return normalizarBusqueda(contenido).includes(texto)
  })
}
