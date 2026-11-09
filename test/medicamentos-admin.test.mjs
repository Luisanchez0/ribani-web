import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filtrarMedicamentos } from '../src/features/medicamentos/utils/filtrar-medicamentos.ts'
import { formatFechaMedicamento } from '../src/features/medicamentos/utils/format-fecha-medicamento.ts'

const medicamentos = [
  { id: '1', adulto_id: 'a', nombre: 'Ácido fólico', instrucciones: null, activo: true },
  { id: '2', adulto_id: 'a', nombre: 'Vitamina D', instrucciones: 'Después de comer', activo: false },
  { id: '3', adulto_id: 'b', nombre: 'Calcio', instrucciones: 'Con la cena', activo: true },
]
const nombres = new Map([['a', 'María López'], ['b', 'José Pérez']])

test('la búsqueda encuentra medicamentos, instrucciones y adultos sin distinguir acentos', () => {
  assert.deepEqual(filtrarMedicamentos(medicamentos, '  ACIDO  ', 'todos', nombres).map(m => m.id), ['1'])
  assert.deepEqual(filtrarMedicamentos(medicamentos, 'despues', 'todos', nombres).map(m => m.id), ['2'])
  assert.deepEqual(filtrarMedicamentos(medicamentos, 'maria', 'todos', nombres).map(m => m.id), ['1', '2'])
})

test('el filtro de estado se combina con la búsqueda sin modificar los registros', () => {
  assert.deepEqual(filtrarMedicamentos(medicamentos, 'maria', 'activos', nombres).map(m => m.id), ['1'])
  assert.deepEqual(filtrarMedicamentos(medicamentos, '', 'inactivos', nombres).map(m => m.id), ['2'])
  assert.equal(filtrarMedicamentos(medicamentos, '', 'todos', nombres).length, 3)
  assert.equal(medicamentos[0].nombre, 'Ácido fólico')
})

test('la búsqueda distingue cero resultados y funciona sin nombres de adultos', () => {
  assert.deepEqual(filtrarMedicamentos(medicamentos, 'sin coincidencia', 'todos', nombres), [])
  assert.deepEqual(filtrarMedicamentos([], '', 'todos', nombres), [])
  assert.equal(filtrarMedicamentos(medicamentos, 'calcio', 'activos', new Map())[0].id, '3')
})

test('las fechas de calendario conservan el día registrado al mostrarse en México', () => {
  assert.equal(formatFechaMedicamento('2026-11-08'), '8 nov 2026')
  assert.equal(formatFechaMedicamento('2026-11-08T00:00:00.000Z'), '8 nov 2026')
})
