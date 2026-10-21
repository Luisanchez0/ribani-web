import { test } from 'node:test'
import assert from 'node:assert/strict'
import { etiquetaWhatsapp, resumirWhatsapp } from '../src/features/whatsapp/utils/estados.ts'

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
