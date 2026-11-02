import { test } from 'node:test'
import assert from 'node:assert/strict'
import { etiquetaWhatsapp, resumirWhatsapp, filtrarHistorialWhatsapp } from '../src/features/whatsapp/utils/estados.ts'

test('WhatsApp diferencia aceptación, entrega y lectura', () => {
  assert.equal(etiquetaWhatsapp('ENVIADA'), 'Aceptada por Meta')
  assert.equal(etiquetaWhatsapp('ENTREGADA'), 'Entregada')
  assert.equal(etiquetaWhatsapp('LEIDA'), 'Leída')
})
test('el resumen usa estados reales por alerta y conserva entregas parciales', () => {
  const filas = [{ alerta_id: 'a', estado: 'ENTREGADA', cantidad: 1 }, { alerta_id: 'a', estado: 'FALLIDA', cantidad: 2 }, { alerta_id: 'b', estado: 'LEIDA', cantidad: 10 }]
  assert.equal(resumirWhatsapp(filas, 'a'), 'Entregada: 1 · Fallida: 2')
  assert.equal(resumirWhatsapp(filas, 'c'), 'Sin envíos')
})
test('sin respuesta no se inventa un envío ni una confirmación', () => {
  assert.equal(resumirWhatsapp(undefined, 'a'), 'Sin datos')
})

test('el historial combina destinatario y estado sin confundir aceptación con entrega', () => {
  const mensajes = [
    { id: '1', destinatario_id: 'a', estado: 'ENVIADA', tipo: 'PRUEBA' },
    { id: '2', destinatario_id: 'a', estado: 'ENTREGADA', tipo: 'PRUEBA' },
    { id: '3', destinatario_id: 'b', estado: 'ENTREGADA', tipo: 'ALERTA' },
  ]
  const nombres = new Map([['a', 'María López (+525500000001)'], ['b', 'Pedro (+525500000002)']])
  assert.deepEqual(filtrarHistorialWhatsapp(mensajes, '  MARIA  ', 'ENTREGADA', nombres).map((m) => m.id), ['2'])
  assert.equal(filtrarHistorialWhatsapp(mensajes, '000002', '', nombres)[0].id, '3')
  assert.deepEqual(filtrarHistorialWhatsapp(mensajes, '', '', nombres), mensajes)
  assert.equal(mensajes.length, 3)
})

test('el historial permite buscar el tipo y distingue cero coincidencias', () => {
  const mensajes = [{ id: '1', destinatario_id: 'a', estado: 'ENVIADA', tipo: 'PRUEBA' }]
  assert.equal(filtrarHistorialWhatsapp(mensajes, 'prueba', '', new Map()).length, 1)
  assert.deepEqual(filtrarHistorialWhatsapp(mensajes, 'desconocido', '', new Map()), [])
  assert.deepEqual(filtrarHistorialWhatsapp([], '', '', new Map()), [])
})
