import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resumirAlertasPendientes, contarListado } from '../src/features/panel/utils/resumen-admin.ts'
import { accionesDisponibles } from '../src/features/alertas/utils/acciones-alerta.ts'

test('las alertas pendientes excluyen cerradas y priorizan severidad y antigüedad', () => {
  const alertas = [
    { id: 'resuelta', estado: 'RESUELTA', severidad: 'CRITICA', ocurrida_en: '2026-11-01T10:00:00Z' },
    { id: 'media', estado: 'ABIERTA', severidad: 'MEDIA', ocurrida_en: '2026-11-01T10:00:00Z' },
    { id: 'nueva', estado: 'EN_ATENCION', severidad: 'CRITICA', ocurrida_en: '2026-11-08T10:00:00Z' },
    { id: 'antigua', estado: 'ABIERTA', severidad: 'CRITICA', ocurrida_en: '2026-11-07T10:00:00Z' },
    { id: 'cancelada', estado: 'CANCELADA', severidad: 'ALTA', ocurrida_en: '2026-11-01T10:00:00Z' },
  ]
  const resultado = resumirAlertasPendientes(alertas)
  assert.deepEqual(resultado.prioritarias.map(a => a.id), ['antigua', 'nueva', 'media'])
  assert.equal(resultado.abiertas, 2)
  assert.equal(resultado.enAtencion, 1)
  assert.equal(resultado.criticas, 2)
  assert.equal(alertas[0].id, 'resuelta')
})

test('el resumen vacío conserva ceros y limita solo la vista, no los indicadores', () => {
  assert.deepEqual(resumirAlertasPendientes([]), { abiertas: 0, enAtencion: 0, criticas: 0, prioritarias: [] })
  const alertas = Array.from({ length: 12 }, (_, id) => ({ id: String(id), estado: 'ABIERTA', severidad: 'ALTA', ocurrida_en: '2026-11-08T10:00:00Z' }))
  assert.equal(resumirAlertasPendientes(alertas).abiertas, 12)
  assert.equal(resumirAlertasPendientes(alertas).prioritarias.length, 6)
})

test('una transición entre consultas no duplica la alerta ni sus indicadores', () => {
  const base = { id: 'a', severidad: 'CRITICA', ocurrida_en: '2026-11-08T10:00:00Z' }
  const resumen = resumirAlertasPendientes([{ ...base, estado: 'ABIERTA' }, { ...base, estado: 'EN_ATENCION' }])
  assert.equal(resumen.abiertas, 0)
  assert.equal(resumen.enAtencion, 1)
  assert.equal(resumen.criticas, 1)
  assert.equal(resumen.prioritarias.length, 1)
})

test('un listado que alcanza su límite se identifica como conteo mínimo', () => {
  assert.equal(contarListado(0, 500), '0')
  assert.equal(contarListado(5, 500), '5')
  assert.equal(contarListado(500, 500), '500+')
  assert.equal(contarListado(499, 500, 500), '499+')
})

test('las acciones respetan las transiciones existentes del backend', () => {
  assert.deepEqual(accionesDisponibles('ABIERTA').map(a => a.estado), ['EN_ATENCION', 'RESUELTA', 'CANCELADA'])
  assert.deepEqual(accionesDisponibles('EN_ATENCION').map(a => a.estado), ['RESUELTA', 'CANCELADA'])
  assert.deepEqual(accionesDisponibles('RESUELTA'), [])
  assert.deepEqual(accionesDisponibles('CANCELADA'), [])
})
