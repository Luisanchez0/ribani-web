import assert from 'node:assert/strict'
import { beforeEach, mock, test } from 'node:test'

const storage = new Map()
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
}
const { queryClient } = await import('../src/lib/query-client.ts')
globalThis.window = { localStorage: globalThis.localStorage }
const { useAuthStore } = await import('../src/stores/auth-store.ts')
const { apiClient } = await import('../src/lib/api-client.ts')
const { default: axios, AxiosError } = await import('axios')
const originalAdapter = apiClient.defaults.adapter

function sesion(id = 'usuario-a', accessToken = 'token-a') {
  return {
    accessToken, refreshToken: `refresh-${id}`,
    usuario: {
      id, nombre: id, apellido: 'Prueba', email: `${id}@ribani.test`,
      telefono: null, emailVerificado: true, twoFactorEnabled: false,
      rol: { id: 2, codigo: 'FAMILIAR_ENCARGADO', nombre: 'Familiar' }, permisos: [],
    },
  }
}

beforeEach(() => {
  mock.restoreAll()
  apiClient.defaults.adapter = originalAdapter
  useAuthStore.getState().clearSesion()
  queryClient.clear()
})

test('cerrar sesión elimina consultas y secretos 2FA de la caché', () => {
  useAuthStore.getState().setSesion(sesion())
  queryClient.setQueryData(['usuarios'], [{ id: 'privado' }])
  queryClient.setQueryData(['dos-pasos-propio', 'setup'], { secret: 'secreto-local' })
  useAuthStore.getState().clearSesion()
  assert.equal(queryClient.getQueryCache().getAll().length, 0)
  assert.equal(useAuthStore.getState().token, null)
  assert.equal(useAuthStore.getState().usuario, null)
  assert.equal(JSON.parse(storage.get('ribani-auth')).state.refreshToken, null)
})

test('cambiar de cuenta elimina los datos de la cuenta anterior', () => {
  useAuthStore.getState().setSesion(sesion())
  queryClient.setQueryData(['adultos', 'mis-adultos'], [{ id: 'adulto-a' }])
  useAuthStore.getState().setSesion(sesion('usuario-b', 'token-b'))
  assert.equal(queryClient.getQueryData(['adultos', 'mis-adultos']), undefined)
})

test('renovar tokens de la misma cuenta conserva la caché', () => {
  useAuthStore.getState().setSesion(sesion())
  queryClient.setQueryData(['usuarios'], ['dato'])
  useAuthStore.getState().setSesion(sesion('usuario-a', 'token-renovado'))
  assert.deepEqual(queryClient.getQueryData(['usuarios']), ['dato'])
})

test('una consulta que termina después del logout no repuebla la caché', async () => {
  useAuthStore.getState().setSesion(sesion())
  let resolver
  const pendiente = queryClient.fetchQuery({
    queryKey: ['privado'], queryFn: () => new Promise((resolve) => { resolver = resolve }),
  }).catch(() => undefined)
  useAuthStore.getState().clearSesion()
  resolver('dato-privado')
  await pendiente
  assert.equal(queryClient.getQueryData(['privado']), undefined)
})

function rechazarCon401(config) {
  throw new AxiosError('Sesión expirada', 'ERR_BAD_REQUEST', config, undefined, {
    status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config,
  })
}

test('un refresh tardío no restaura la sesión después de salir', async () => {
  useAuthStore.getState().setSesion(sesion())
  let resolverRefresh
  let notificarInicio
  const inicio = new Promise((resolve) => { notificarInicio = resolve })
  mock.method(axios, 'post', () => {
    notificarInicio()
    return new Promise((resolve) => { resolverRefresh = resolve })
  })
  apiClient.defaults.adapter = rechazarCon401
  const peticion = apiClient.get('/usuarios').catch(() => undefined)
  await inicio
  useAuthStore.getState().clearSesion()
  const nueva = sesion()
  resolverRefresh({ data: { ...nueva, user: nueva.usuario } })
  await peticion
  assert.equal(useAuthStore.getState().token, null)
})

test('un 401 tardío de otra cuenta no cierra la sesión nueva', async () => {
  useAuthStore.getState().setSesion(sesion())
  let rechazar
  let notificarInicio
  const inicio = new Promise((resolve) => { notificarInicio = resolve })
  apiClient.defaults.adapter = (config) => {
    notificarInicio()
    return new Promise((_, reject) => { rechazar = () => {
      try { rechazarCon401(config) } catch (error) { reject(error) }
    } })
  }
  mock.method(axios, 'post', async () => { throw new Error('No debe refrescar') })
  const peticion = apiClient.get('/usuarios').catch(() => undefined)
  await inicio
  useAuthStore.getState().setSesion(sesion('usuario-b', 'token-b'))
  rechazar()
  await peticion
  assert.equal(useAuthStore.getState().token, 'token-b')
  assert.equal(axios.post.mock.callCount(), 0)
})

test('un reintento de otra sesión no se envía con las credenciales nuevas', async () => {
  useAuthStore.getState().setSesion(sesion())
  const revisionAnterior = useAuthStore.getState().sessionRevision
  useAuthStore.getState().setSesion(sesion('usuario-b', 'token-b'))
  let envios = 0
  apiClient.defaults.adapter = async (config) => {
    envios++
    return { data: 'no-debe-enviarse', status: 200, headers: {}, config }
  }
  await assert.rejects(apiClient.get('/usuarios', { ribaniRevision: revisionAnterior }))
  assert.equal(envios, 0)
  assert.equal(useAuthStore.getState().token, 'token-b')
})

test('un refresh rechazado elimina credenciales y caché privada', async () => {
  useAuthStore.getState().setSesion(sesion())
  queryClient.setQueryData(['privado'], 'dato-privado')
  apiClient.defaults.adapter = rechazarCon401
  mock.method(axios, 'post', async () => { throw new Error('Refresh revocado') })
  await assert.rejects(apiClient.get('/usuarios'))
  assert.equal(useAuthStore.getState().token, null)
  assert.equal(queryClient.getQueryData(['privado']), undefined)
})

test('una respuesta exitosa de la sesión anterior no llega al consumidor', async () => {
  useAuthStore.getState().setSesion(sesion())
  let responder
  apiClient.defaults.adapter = (config) => new Promise((resolve) => {
    responder = () => resolve({ data: 'privado-a', status: 200, headers: {}, config })
  })
  const peticion = apiClient.get('/usuarios')
  useAuthStore.getState().setSesion(sesion('usuario-b', 'token-b'))
  responder()
  await assert.rejects(peticion, (error) => axios.isCancel(error))
})

test('varios 401 concurrentes renuevan una sola vez', async () => {
  useAuthStore.getState().setSesion(sesion())
  let resolverRefresh
  let notificarInicio
  let intentos = 0
  const inicio = new Promise((resolve) => { notificarInicio = resolve })
  const refresh = mock.method(axios, 'post', () =>
    new Promise((resolve) => { resolverRefresh = resolve }),
  )
  apiClient.defaults.adapter = async (config) => {
    if (config.headers.get('Authorization') !== 'Bearer renovado') {
      if (++intentos === 2) notificarInicio()
      return rechazarCon401(config)
    }
    return { data: 'ok', status: 200, statusText: 'OK', headers: {}, config }
  }
  const peticiones = Promise.all([apiClient.get('/usuarios'), apiClient.get('/roles')])
  await inicio
  // Ambos adaptadores ya recibieron 401; el primer interceptor inició el refresh.
  await new Promise(setImmediate)
  const renovada = sesion('usuario-a', 'renovado')
  resolverRefresh({ data: { ...renovada, user: renovada.usuario } })
  await peticiones
  assert.equal(refresh.mock.callCount(), 1)
  assert.equal(useAuthStore.getState().token, 'renovado')
})

test('salir o cambiar de cuenta aborta el SSE y el token solo viaja en headers', async (t) => {
  useAuthStore.getState().setSesion(sesion())
  const previousWindow = globalThis.window
  const previousDocument = globalThis.document
  const peticiones = []
  globalThis.document = { removeEventListener() {} }
  globalThis.window = {
    clearTimeout, setTimeout,
    fetch: (url, options) => {
      peticiones.push({ url, ...options })
      return new Promise(() => {})
    },
  }
  t.after(() => { globalThis.window = previousWindow; globalThis.document = previousDocument })
  const { abrirStreamSse } = await import('../src/lib/sse.ts')
  const cerrar = abrirStreamSse('/ubicaciones/stream?adultoId=adulto-1')
  assert.equal(peticiones[0].headers.Authorization, 'Bearer token-a')
  assert.equal(peticiones[0].url.includes('token-a'), false)
  useAuthStore.getState().clearSesion()
  assert.equal(peticiones[0].signal.aborted, true)
  cerrar()

  useAuthStore.getState().setSesion(sesion())
  const cerrarOtra = abrirStreamSse('/ubicaciones/stream?adultoId=adulto-1')
  useAuthStore.getState().setSesion(sesion('usuario-b', 'token-b'))
  assert.equal(peticiones[1].signal.aborted, true)
  cerrarOtra()
})
