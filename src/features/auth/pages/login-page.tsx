import { isAxiosError } from 'axios'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

import { useLogin } from '../hooks/use-login'
import { useRegistroFamiliar } from '../hooks/use-registro-familiar'
import { esDesafioDosPasos } from '../types'

type Vista = 'login' | 'registro'

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

const estilosTab = (activa: boolean) =>
  `flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    activa
      ? 'bg-white text-slate-900 shadow-sm'
      : 'text-slate-500 hover:text-slate-700'
  }`

export function LoginPage() {
  const [vista, setVista] = useState<Vista>('login')

  // Login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const login = useLogin()

  // Registro de familiar encargado
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [emailRegistro, setEmailRegistro] = useState('')
  const [telefono, setTelefono] = useState('')
  const [passwordRegistro, setPasswordRegistro] = useState('')
  const registro = useRegistroFamiliar()

  const requiereDosPasos = login.data
    ? esDesafioDosPasos(login.data)
    : false

  function handleSubmitLogin(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    login.mutate({ email, password })
  }

  function handleSubmitRegistro(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    registro.mutate(
      {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: emailRegistro.trim(),
        telefono: telefono.trim(),
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
    <section className="flex min-h-dvh items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-slate-900">RIBANI</h1>
        <p className="mt-1 text-sm text-slate-500">
          Seguimiento de adultos mayores
        </p>

        <div
          role="tablist"
          aria-label="Acceso a la aplicación"
          className="mt-4 flex gap-1 rounded-lg bg-slate-100 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={vista === 'login'}
            className={estilosTab(vista === 'login')}
            onClick={() => setVista('login')}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={vista === 'registro'}
            className={estilosTab(vista === 'registro')}
            onClick={() => setVista('registro')}
          >
            Crear cuenta
          </button>
        </div>

        {vista === 'login' ? (
          <form className="mt-6 space-y-4" onSubmit={handleSubmitLogin}>
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
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
                className="block text-sm font-medium text-slate-700"
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

            {requiereDosPasos && (
              <Alert variant="info">
                Esta cuenta requiere verificación en dos pasos. Ese flujo se
                implementará próximamente.
              </Alert>
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
          </form>
        ) : (
          <div className="mt-6">
            <h2 className="text-base font-semibold text-slate-900">
              ¿Cuidas a un adulto mayor?
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Crea tu cuenta de familiar encargado para seguir su ubicación,
              recibir alertas y gestionar sus cuidados desde el panel.
            </p>

            <form className="mt-4 space-y-4" onSubmit={handleSubmitRegistro}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="registro-nombre"
                    className="block text-sm font-medium text-slate-700"
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
                    className="block text-sm font-medium text-slate-700"
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
                  className="block text-sm font-medium text-slate-700"
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
                  className="block text-sm font-medium text-slate-700"
                >
                  Teléfono
                </label>
                <Input
                  id="registro-telefono"
                  name="telefono"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={telefono}
                  onChange={(evento) => setTelefono(evento.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="registro-password"
                  className="block text-sm font-medium text-slate-700"
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
                <p className="text-xs text-slate-500">
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
      </Card>
    </section>
  )
}
