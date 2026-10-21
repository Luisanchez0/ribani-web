import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { EscudoRibani } from '@/components/ui/escudo'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

import { useLogin } from '../hooks/use-login'
import { useLoginDosPasos } from '../hooks/use-login-dos-pasos'
import { useRegistroFamiliar } from '../hooks/use-registro-familiar'
import { useRecuperarPassword } from '../hooks/use-recuperar-password'
import { PAISES_TELEFONO } from '../datos/paises-telefono'
import { esDesafioDosPasos } from '../types'

type Vista = 'login' | 'registro' | 'recuperar'
type PasoRecuperar = 'solicitar' | 'restablecer'

/** Traduce errores HTTP del backend a mensajes comprensibles (ver AGENTS.md). */
function mensajeDeError(error: unknown): string {
  if (isAxiosError(error)) {
    const data: unknown = error.response?.data

    if (
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string'
    ) {
      return data.message
    }
  }

  return 'No se pudo completar la operación. Intenta de nuevo.'
}

const claseTab = (activa: boolean) =>
  `flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    activa
      ? 'bg-white text-pino-900 shadow-sm'
      : 'text-salvia-600 hover:text-pino-800'
  }`


function MarcaAcceso() {
  return (
    <div className="relative hidden flex-col justify-between bg-pino-900 p-10 text-pino-50 lg:flex">
      {/* Sombra de follaje: gradiente sutil, sin decoración adicional */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(103,159,126,0.25),_transparent_55%)]"
      />

      <p className="relative font-display text-3xl font-semibold tracking-tight">
        RIBANI
      </p>

      <div className="relative max-w-sm">
        <EscudoRibani className="h-16 w-16" />


        <h2 className="mt-6 font-display text-2xl/8 font-semibold text-white">
          Siempre cerca de quien cuidas
        </h2>
        <p className="mt-3 text-sm/6 text-pino-200">
          Ubicación en tiempo real, alertas y medicamentos de tu familiar,
          en un solo lugar.
        </p>
      </div>

      <p className="relative text-xs text-pino-400">
        Seguimiento de adultos mayores
      </p>
    </div>
  )
}

export function LoginPage() {
  const [vista, setVista] = useState<Vista>('login')

  // Login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const login = useLogin()
  const loginDosPasos = useLoginDosPasos()
  const [codigoDosPasos, setCodigoDosPasos] = useState('')

  // Registro de familiar encargado
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [emailRegistro, setEmailRegistro] = useState('')
  const [codigoPais, setCodigoPais] = useState(PAISES_TELEFONO[0].codigo)
  const [telefono, setTelefono] = useState('')
  const [passwordRegistro, setPasswordRegistro] = useState('')
  const registro = useRegistroFamiliar()

  /**
   * Desafío 2FA activo: /auth/login respondió twoFactorRequired y quedó
   * pendiente la verifición del código (/auth/2fa/login) para emitir los
   * tokens definitivos.
   */
  const desafioDosPasos =
    login.data && esDesafioDosPasos(login.data) ? login.data : null

  // Recuperación de contraseña (código por correo, dos pasos)
  const { solicitar: solicitarReset, restablecer: restablecerPassword } =
    useRecuperarPassword()
  const [pasoRecuperar, setPasoRecuperar] = useState<PasoRecuperar>('solicitar')
  const [emailRecuperar, setEmailRecuperar] = useState('')
  const [codigoRecuperar, setCodigoRecuperar] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [passwordNuevaConfirm, setPasswordNuevaConfirm] = useState('')

  /**
   * Renovación silenciosa del desafío cada MINUTO: el challengeToken nace
   * de POST /auth/login, así que se re-emite con las MISMAS credenciales
   * (siguen en memoria) sin mostrar cuenta regresiva ni interrumpir al
   * usuario. Si la renovación falla, se detiene el reintento y se avisa
   * en pantalla (login.isError).
   */
  useEffect(() => {
    if (
      !desafioDosPasos ||
      login.isPending ||
      login.isError ||
      loginDosPasos.isPending
    ) {
      return
    }

    const id = window.setInterval(() => {
      login.mutate({ email, password })
    }, 60_000)

    return () => window.clearInterval(id)
  }, [desafioDosPasos, login, loginDosPasos.isPending, email, password])

  function handleSubmitLogin(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    login.mutate({ email, password })
  }

  function handleSubmitDosPasos(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    if (!desafioDosPasos) return

    loginDosPasos.mutate({
      challengeToken: desafioDosPasos.challengeToken,
      code: codigoDosPasos.trim().replace(/\s/g, ''),
    })
  }

  function handleSubmitSolicitarReset(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    solicitarReset.mutate(emailRecuperar, {
      // Mueste el paso 2 aunque el correo no exista: la respuesta es
      // genérica a propósito (no revela cuentas registradas).
      onSuccess: () => setPasoRecuperar('restablecer'),
    })
  }

  function handleSubmitRestablecer(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    if (passwordNueva !== passwordNuevaConfirm) return

    restablecerPassword.mutate({
      email: emailRecuperar.trim(),
      codigo: codigoRecuperar.trim(),
      password: passwordNueva,
    })
  }

  function salirDeRecuperar() {
    solicitarReset.reset()
    restablecerPassword.reset()
    setPasoRecuperar('solicitar')
    setCodigoRecuperar('')
    setPasswordNueva('')
    setPasswordNuevaConfirm('')
    setVista('login')
  }

  function handleSubmitRegistro(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    registro.mutate(
      {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: emailRegistro.trim(),
        telefono: `${codigoPais}${telefono.trim()}`,
        password: passwordRegistro,
      },
      {
        onSuccess: () => {
          setNombre('')
          setApellido('')
          setEmailRegistro('')
          setTelefono('')
          setPasswordRegistro('')
        },
      },
    )
  }

  return (
    <section className="grid min-h-dvh bg-salvia-50 lg:grid-cols-[5fr_7fr]">
      <MarcaAcceso />

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <p className="font-display text-2xl font-semibold tracking-tight text-pino-900 lg:hidden">
            RIBANI
          </p>

          <div
            role="tablist"
            aria-label="Acceso a la aplicación"
            className="mt-6 flex gap-1 rounded-lg bg-salvia-100 p-1 lg:mt-0"
          >
            <button
              type="button"
              role="tab"
              aria-selected={vista === 'login'}
              className={claseTab(vista === 'login')}
              onClick={() => setVista('login')}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={vista === 'registro'}
              className={claseTab(vista === 'registro')}
              onClick={() => setVista('registro')}
            >
              Crear cuenta
            </button>
          </div>

          {desafioDosPasos ? (
            /* Verificación en dos pasos: segundo paso del login. */
            <form
              className="mt-8 space-y-5"
              onSubmit={handleSubmitDosPasos}
            >
              <div>
                <h1 className="font-display text-xl font-semibold text-pino-900">
                  Verificación en dos pasos
                </h1>
                <p className="mt-1.5 text-sm/6 text-salvia-700">
                  Tu cuenta tiene el 2FA activado. Escribe el código de 6
                  dígitos de tu app authenticator para terminar de iniciar
                  sesión.
                </p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="codigo-2fa"
                  className="block text-sm font-medium text-pino-900"
                >
                  Código de la app authenticator
                </label>
                <Input
                  id="codigo-2fa"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  maxLength={8}
                  required
                  className="text-center text-lg tracking-[0.4em]"
                  value={codigoDosPasos}
                  onChange={(evento) =>
                    setCodigoDosPasos(evento.target.value.replace(/[^\d]/g, ''))
                  }
                />
                <p className="text-xs text-salvia-600">
                  El código es de 6 dígitos y cambia cada 30 segundos.
                </p>

              </div>

              {loginDosPasos.isError && (
                <Alert variant="error">
                  {mensajeDeError(loginDosPasos.error)}
                </Alert>
              )}

              {/* La renovación automática del desafío falló (p. ej. red). */}
              {login.isError && (
                <Alert variant="error">
                  Tu verificación expiró y no se pudo renovar automáticamente.
                  Usa «Volver a iniciar sesión» e intenta de nuevo.
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loginDosPasos.isPending}
              >
                {loginDosPasos.isPending ? (
                  <Spinner size="sm" label="Verificando…" />
                ) : (
                  'Verificar y entrar'
                )}
              </Button>

              <button
                type="button"
                className="w-full text-center text-sm font-medium text-salvia-600 hover:text-pino-800"
                onClick={() => {
                  loginDosPasos.reset()
                  setCodigoDosPasos('')
                  // Vuelve al paso 1: la contraseña se pide de nuevo y el
                  // backend emite un challengeToken fresco.
                  login.reset()
                }}
              >
                Volver a iniciar sesión
              </button>
            </form>
          ) : vista === 'login' ? (
            <form className="mt-8 space-y-5" onSubmit={handleSubmitLogin}>
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-pino-900"
                >
                  Correo electrónico
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(evento) => setEmail(evento.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-pino-900"
                >
                  Contraseña
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(evento) => setPassword(evento.target.value)}
                />
              </div>

              {login.isError && (
                <Alert variant="error">{mensajeDeError(login.error)}</Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={login.isPending}
              >
                {login.isPending ? (
                  <Spinner size="sm" label="Iniciando sesión…" />
                ) : (
                  'Iniciar sesión'
                )}
              </Button>

              <button
                type="button"
                className="w-full text-center text-sm font-medium text-salvia-600 hover:text-pino-800"
                onClick={() => {
                  setEmailRecuperar(email)
                  solicitarReset.reset()
                  restablecerPassword.reset()
                  setPasoRecuperar('solicitar')
                  setVista('recuperar')
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </form>
          ) : vista === 'recuperar' ? (
            pasoRecuperar === 'solicitar' ? (
              <form
                className="mt-8 space-y-5"
                onSubmit={handleSubmitSolicitarReset}
              >
                <div>
                  <h1 className="font-display text-xl font-semibold text-pino-900">
                    Recuperar contraseña
                  </h1>
                  <p className="mt-1.5 text-sm/6 text-salvia-700">
                    Escribe el correo de tu cuenta. Te enviaremos un código
                    de 6 dígitos válido por 10 minutos.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="recuperar-email"
                    className="block text-sm font-medium text-pino-900"
                  >
                    Correo electrónico
                  </label>
                  <Input
                    id="recuperar-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={emailRecuperar}
                    onChange={(evento) =>
                      setEmailRecuperar(evento.target.value)
                    }
                  />
                </div>

                {solicitarReset.isError && (
                  <Alert variant="error">
                    {mensajeDeError(solicitarReset.error)}
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={solicitarReset.isPending}
                >
                  {solicitarReset.isPending ? (
                    <Spinner size="sm" label="Enviando código…" />
                  ) : (
                    'Enviar código'
                  )}
                </Button>

                <button
                  type="button"
                  className="w-full text-center text-sm font-medium text-salvia-600 hover:text-pino-800"
                  onClick={salirDeRecuperar}
                >
                  Volver a iniciar sesión
                </button>
              </form>
            ) : (
            <form className="mt-8 space-y-5" onSubmit={handleSubmitRestablecer}>
                <div>
                  <h1 className="font-display text-xl font-semibold text-pino-900">
                    Restablecer contraseña
                  </h1>
                  <p className="mt-1.5 text-sm/6 text-salvia-700">
                    Escribe el código enviado a{' '}
                    <strong>{emailRecuperar.trim()}</strong> y tu contraseña
                    nueva.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="recuperar-codigo"
                    className="block text-sm font-medium text-pino-900"
                  >
                    Código del correo
                  </label>
                  <Input
                    id="recuperar-codigo"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    maxLength={6}
                    required
                    className="text-center text-lg tracking-[0.4em]"
                    value={codigoRecuperar}
                    onChange={(evento) =>
                      setCodigoRecuperar(
                        evento.target.value.replace(/[^\d]/g, ''),
                      )
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="recuperar-password"
                    className="block text-sm font-medium text-pino-900"
                  >
                    Contraseña nueva
                  </label>
                  <Input
                    id="recuperar-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={passwordNueva}
                    onChange={(evento) => setPasswordNueva(evento.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="recuperar-password-confirm"
                    className="block text-sm font-medium text-pino-900"
                  >
                    Confirmar contraseña
                  </label>
                  <Input
                    id="recuperar-password-confirm"
                    name="password-confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={passwordNuevaConfirm}
                    onChange={(evento) =>
                      setPasswordNuevaConfirm(evento.target.value)
                    }
                  />
                  {passwordNuevaConfirm.length > 0 &&
                    passwordNueva !== passwordNuevaConfirm && (
                      <p className="text-xs text-red-700">
                        Las contraseñas no coinciden.
                      </p>
                    )}
                </div>

                {restablecerPassword.isError && (
                  <Alert variant="error">
                    {mensajeDeError(restablecerPassword.error)}
                  </Alert>
                )}

                {restablecerPassword.isSuccess && (
                  <Alert variant="success">
                    Contraseña actualizada. Ya puedes iniciar sesión con la
                    nueva ({restablecerPassword.data?.mensaje}).
                  </Alert>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    className="flex-1 text-center text-sm font-medium text-salvia-600 hover:text-pino-800"
                    onClick={() => {
                      restablecerPassword.reset()
                      setPasoRecuperar('solicitar')
                    }}
                  >
                    Reenviar código
                  </button>
                  <Button
                    type="submit"
                    className="flex-[2]"
                    disabled={
                      restablecerPassword.isPending ||
                      (passwordNuevaConfirm.length > 0 &&
                        passwordNueva !== passwordNuevaConfirm)
                    }
                  >
                    {restablecerPassword.isPending ? (
                      <Spinner size="sm" label="Restableciendo…" />
                    ) : (
                      'Restablecer'
                    )}
                  </Button>
                </div>
              </form>
            )
          ) : (
            <div className="mt-8">
              <h1 className="font-display text-xl font-semibold text-pino-900">
                ¿Cuidas a un adulto mayor?
              </h1>
              <p className="mt-1.5 text-sm/6 text-salvia-700">
                Crea tu cuenta de familiar encargado para seguir su ubicación,
                recibir alertas y gestionar sus cuidados desde el panel.
              </p>

              <form className="mt-6 space-y-5" onSubmit={handleSubmitRegistro}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="registro-nombre"
                      className="block text-sm font-medium text-pino-900"
                    >
                      Nombre
                    </label>
                    <Input
                      id="registro-nombre"
                      name="nombre"
                      type="text"
                      autoComplete="given-name"
                      required
                      value={nombre}
                      onChange={(evento) => setNombre(evento.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="registro-apellido"
                      className="block text-sm font-medium text-pino-900"
                    >
                      Apellido
                    </label>
                    <Input
                      id="registro-apellido"
                      name="apellido"
                      type="text"
                      autoComplete="family-name"
                      required
                      value={apellido}
                      onChange={(evento) => setApellido(evento.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="registro-email"
                    className="block text-sm font-medium text-pino-900"
                  >
                    Correo electrónico
                  </label>
                  <Input
                    id="registro-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={emailRegistro}
                    onChange={(evento) => setEmailRegistro(evento.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="registro-telefono"
                    className="block text-sm font-medium text-pino-900"
                  >
                    Teléfono
                  </label>
                  <div className="flex gap-2">
                    <select
                      id="registro-codigo-pais"
                      aria-label="Código de país"
                      className="w-auto shrink-0 rounded-md border border-salvia-300 bg-white px-2 py-2 text-sm text-pino-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600"
                      value={codigoPais}
                      onChange={(evento) => setCodigoPais(evento.target.value)}
                    >
                      {PAISES_TELEFONO.map((pais) => (
                        <option key={pais.codigo} value={pais.codigo}>
                          {pais.bandera} {pais.codigo}
                        </option>
                      ))}
                    </select>
                    <Input
                      id="registro-telefono"
                      name="telefono"
                      type="tel"
                      autoComplete="tel-national"
                      required
                      inputMode="tel"
                      placeholder="300 123 4567"
                      value={telefono}
                      onChange={(evento) => setTelefono(evento.target.value)}
                    />
                  </div>
                  <p className="text-xs text-salvia-600">
                    Incluye el código de país para contactarte en emergencias.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="registro-password"
                    className="block text-sm font-medium text-pino-900"
                  >
                    Contraseña
                  </label>
                  <Input
                    id="registro-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={passwordRegistro}
                    onChange={(evento) =>
                      setPasswordRegistro(evento.target.value)
                    }
                  />
                  <p className="text-xs text-salvia-600">
                    Mínimo 8 caracteres.
                  </p>
                </div>

                {registro.isError && (
                  <Alert variant="error">
                    {mensajeDeError(registro.error)}
                  </Alert>
                )}

                {registro.isSuccess && (
                  <Alert variant="success">
                    ¡Cuenta creada! Ya puedes iniciar sesión con tu correo y
                    contraseña.
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={registro.isPending}
                >
                  {registro.isPending ? (
                    <Spinner size="sm" label="Creando cuenta…" />
                  ) : (
                    'Crear cuenta'
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
