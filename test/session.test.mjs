import assert from 'node:assert/strict'
import { beforeEach, mock, test } from 'node:test'

const storage = new Map()
storage.set('ribani-auth', JSON.stringify({ state: { token: 'legacy-access', refreshToken: 'legacy-refresh' } }))
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
}
const { queryClient } = await import('../src/lib/query-client.ts')
globalThis.window = { localStorage: globalThis.localStorage }
const { useAuthStore } = await import('../src/stores/auth-store.ts')
const { apiClient } = await import('../src/lib/api-client.ts')
const { restaurarSesion } = await import('../src/lib/api-client.ts')
const { default: axios, AxiosError } = await import('axios')
const originalAdapter = apiClient.defaults.adapter

function sesion(id = 'usuario-a', accessToken = 'token-a') {
  return {
    accessToken,
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
  useAuthStore.getState().confirmarCierreSesion()
  queryClient.clear()
})

test('salir sin red conserva solo una marca pública y una recarga no restaura la cookie', async () => {
  useAuthStore.getState().setSesion(sesion())
  useAuthStore.getState().solicitarCierreSesion()
  const request = mock.method(axios, 'post', async () => { throw new Error('Sin red') })
  await restaurarSesion()
  assert.equal(useAuthStore.getState().token, null)
  assert.equal(useAuthStore.getState().logoutPendiente, true)
  assert.equal(storage.get('ribani-logout-pending'), '1')
  assert.equal(request.mock.calls.every((call) => call.arguments[0].endsWith('/auth/web/logout')), true)
  assert.equal(storage.has('ribani-auth'), false)
})

test('al volver la red se revoca la cookie pendiente y solo un login explícito abre otra sesión', async () => {
  useAuthStore.getState().solicitarCierreSesion()
  const request = mock.method(axios, 'post', async () => ({ data: {} }))
  await restaurarSesion()
  assert.equal(request.mock.calls[0].arguments[0].endsWith('/auth/web/logout'), true)
  assert.equal(useAuthStore.getState().token, null)
  assert.equal(useAuthStore.getState().logoutPendiente, false)
  assert.equal(storage.has('ribani-logout-pending'), false)
  useAuthStore.getState().setSesion(sesion())
  assert.equal(useAuthStore.getState().token, 'token-a')
})

test('cerrar sesión elimina consultas y secretos 2FA de la caché', () => {
  useAuthStore.getState().setSesion(sesion())
  queryClient.setQueryData(['usuarios'], [{ id: 'privado' }])
  queryClient.setQueryData(['dos-pasos-propio', 'setup'], { secret: 'secreto-local' })
  useAuthStore.getState().clearSesion()
  assert.equal(queryClient.getQueryCache().getAll().length, 0)
  assert.equal(useAuthStore.getState().token, null)
  assert.equal(useAuthStore.getState().usuario, null)
  assert.equal(storage.has('ribani-auth'), false)
})

test('los tokens permanecen en memoria y se elimina la persistencia antigua al arrancar', () => {
  assert.equal(storage.has('ribani-auth'), false)
  useAuthStore.getState().setSesion(sesion())
  assert.equal(storage.has('ribani-auth'), false)
  assert.equal('refreshToken' in useAuthStore.getState(), false)
})

test('restaura la sesión al recargar usando cookie y sin exponer un refresh token', async () => {
  const restored = sesion()
  const refresh = mock.method(axios, 'post', async () => ({ data: { ...restored, user: restored.usuario } }))
  await restaurarSesion()
  assert.equal(useAuthStore.getState().token, restored.accessToken)
  assert.equal(refresh.mock.calls[0].arguments[0].endsWith('/auth/web/refresh'), true)
  assert.deepEqual(refresh.mock.calls[0].arguments[1], {})
  assert.equal(refresh.mock.calls[0].arguments[2].withCredentials, true)
})

test('un arranque sin cookie termina sin sesión y sin errores sin manejar', async () => {
  mock.method(axios, 'post', async () => { throw new Error('Sin cookie') })
  await restaurarSesion()
  assert.equal(useAuthStore.getState().token, null)
})

test('login, segundo factor y logout usan endpoints web con cookies sin enviar tokens de refresco', async () => {
  const { authApi } = await import('../src/features/auth/api/auth.api.ts')
  const requests = []
  apiClient.defaults.adapter = async (config) => {
    requests.push(config)
    return { data: {}, status: 201, headers: {}, config }
  }
  await authApi.login({ email: 'user@ribani.test', password: 'password-test' })
  await authApi.loginDosPasos('challenge-test', '123456')
  await authApi.logout()
  assert.deepEqual(requests.map((config) => config.url), ['/auth/web/login', '/auth/web/2fa/login', '/auth/web/logout'])
  assert.equal(requests.every((config) => config.withCredentials), true)
  assert.equal(requests.some((config) => String(config.data).includes('refreshToken')), false)
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

test('un endpoint protegido de auth también renueva el access token vencido', async () => {
  useAuthStore.getState().setSesion(sesion())
  mock.method(axios, 'post', async () => {
    const renewed = sesion('usuario-a', 'renovado')
    return { data: { ...renewed, user: renewed.usuario } }
  })
  apiClient.defaults.adapter = async (config) => {
    if (config.headers.get('Authorization') !== 'Bearer renovado') return rechazarCon401(config)
    return { data: 'ok', status: 200, headers: {}, config }
  }
  await apiClient.get('/auth/me')
  assert.equal(useAuthStore.getState().token, 'renovado')
})

test('un código o contraseña de confirmación incorrectos no repiten la operación ni cierran sesión', async () => {
  for (const url of ['/auth/2fa/verify', '/auth/2fa/disable', '/usuarios/perfil/password', '/usuarios/adulto/2fa/verify']) {
    useAuthStore.getState().setSesion(sesion())
    const refresh = mock.method(axios, 'post', async () => {
      const renewed=sesion('usuario-a','renovado')
      return {data:{...renewed,user:renewed.usuario}}
    })
    let attempts=0
    apiClient.defaults.adapter = (config) => { attempts++; return rechazarCon401(config) }
    await assert.rejects(apiClient.post(url,{code:'incorrecto'}))
    assert.equal(useAuthStore.getState().token,'token-a')
    assert.equal(attempts,1)
    assert.equal(refresh.mock.callCount(),0)
    mock.restoreAll()
  }
})

test('logout espera un refresh en vuelo antes de revocar la cookie rotada', async () => {
  const { authApi } = await import('../src/features/auth/api/auth.api.ts')
  useAuthStore.getState().setSesion(sesion())
  let resolveRefresh
  let notifyStart
  const started = new Promise((resolve) => { notifyStart = resolve })
  mock.method(axios, 'post', () => {
    notifyStart()
    return new Promise((resolve) => { resolveRefresh = resolve })
  })
  const requests = []
  apiClient.defaults.adapter = async (config) => {
    requests.push(config.url)
    if (config.url !== '/auth/web/logout') return rechazarCon401(config)
    return { data: {}, status: 201, headers: {}, config }
  }
  const pending = apiClient.get('/usuarios').catch(() => undefined)
  await started
  useAuthStore.getState().clearSesion()
  const logout = authApi.logout()
  await new Promise(setImmediate)
  assert.equal(requests.includes('/auth/web/logout'), false)
  const renewed = sesion('usuario-a', 'renovado')
  resolveRefresh({ data: { ...renewed, user: renewed.usuario } })
  await Promise.all([pending, logout])
  assert.equal(requests.includes('/auth/web/logout'), true)
  assert.equal(useAuthStore.getState().token, null)
})

test('un login nuevo espera el logout pendiente para conservar su propia cookie', async () => {
  const { authApi } = await import('../src/features/auth/api/auth.api.ts')
  const requests = []
  let finishLogout
  apiClient.defaults.adapter = (config) => {
    requests.push(config.url)
    if (config.url === '/auth/web/logout') {
      return new Promise((resolve) => { finishLogout = () => resolve({ data: {}, status: 201, headers: {}, config }) })
    }
    return Promise.resolve({ data: {}, status: 201, headers: {}, config })
  }
  const logout = authApi.logout()
  await new Promise(setImmediate)
  const login = authApi.login({ email: 'user@ribani.test', password: 'password-test' })
  await new Promise(setImmediate)
  assert.deepEqual(requests, ['/auth/web/logout'])
  finishLogout()
  await Promise.all([logout, login])
  assert.deepEqual(requests, ['/auth/web/logout', '/auth/web/login'])
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
