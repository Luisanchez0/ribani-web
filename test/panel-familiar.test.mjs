import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resumirAlertasFamiliares, resumirVinculosFamiliares } from '../src/features/panel/utils/resumen-familiar.ts'

test('el inicio familiar resume solo alertas de vínculos activos', () => {
  const adultos = [{ id: 'a', estado: 'ACTIVA' }, { id: 'b', estado: 'REVOCADA' }]
  const alertas = [
    { id: '1', adulto_id: 'a', estado: 'ABIERTA', severidad: 'ALTA', ocurrida_en: '2026-11-08T10:00:00Z' },
    { id: '2', adulto_id: 'b', estado: 'ABIERTA', severidad: 'CRITICA', ocurrida_en: '2026-11-08T10:00:00Z' },
    { id: '3', adulto_id: 'propio', estado: 'ABIERTA', severidad: 'CRITICA', ocurrida_en: '2026-11-08T10:00:00Z' },
    { id: '4', adulto_id: 'a', estado: 'RESUELTA', severidad: 'CRITICA', ocurrida_en: '2026-11-08T10:00:00Z' },
  ]
  const resumen = resumirAlertasFamiliares(adultos, alertas)
  assert.equal(resumen.abiertas, 1)
  assert.equal(resumen.criticas, 0)
  assert.deepEqual(resumen.prioritarias.map(alerta => alerta.id), ['1'])
})

test('el familiar prioriza alertas críticas y no duplica una alerta que cambia de estado', () => {
  const base = { id: '1', adulto_id: 'a', severidad: 'CRITICA', ocurrida_en: '2026-11-08T10:00:00Z' }
  const resumen = resumirAlertasFamiliares([{ id: 'a', estado: 'ACTIVA' }], [
    { ...base, estado: 'ABIERTA' },
    { ...base, estado: 'EN_ATENCION' },
  ])
  assert.equal(resumen.abiertas, 0)
  assert.equal(resumen.enAtencion, 1)
  assert.equal(resumen.criticas, 1)
  assert.equal(resumen.prioritarias.length, 1)
  assert.equal(resumirAlertasFamiliares([], [{ ...base, estado: 'ABIERTA' }]).abiertas, 0)
})

test('el límite de vínculos se detecta antes de filtrar por estado activo', () => {
  const adultos = Array.from({ length: 100 }, (_, id) => ({ id: String(id), estado: id === 0 ? 'ACTIVA' : 'PENDIENTE' }))
  assert.equal(resumirVinculosFamiliares(adultos).limitado, true)
  assert.equal(resumirVinculosFamiliares(adultos).activos.length, 1)
  assert.equal(resumirVinculosFamiliares(adultos.slice(0, 99)).limitado, false)
  assert.deepEqual(resumirVinculosFamiliares([]), { activos: [], limitado: false })
})
