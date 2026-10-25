import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveApiUrl } from '../src/config/env.ts'

test('desarrollo conserva HTTP localhost', () => {
  assert.equal(resolveApiUrl(undefined, false), 'http://localhost:3000')
})

test('producción exige una API HTTPS configurada', () => {
  assert.throws(() => resolveApiUrl(undefined, true), /HTTPS/)
  assert.throws(() => resolveApiUrl('http://ribani-api.onrender.com', true), /HTTPS/)
  assert.throws(() => resolveApiUrl('javascript:alert(1)', true), /HTTPS/)
  assert.throws(() => resolveApiUrl('invalid-url', true), /HTTPS/)
  assert.equal(resolveApiUrl(' https://ribani-api.onrender.com ', true), 'https://ribani-api.onrender.com')
})
