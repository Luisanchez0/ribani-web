import { useState } from 'react'
import type { FormEvent } from 'react'
import QRCode from 'qrcode'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EscudoRibani } from '@/components/ui/escudo'
import { Spinner } from '@/components/ui/spinner'
import { useAuthStore } from '@/stores/auth-store'
import {
  useConfirmarDosPasos,
  useSetupDosPasos,
} from '../hooks/use-dos-pasos'

type DosPasosModalProps = {
  abierto: boolean
  onCerrar: () => void
}

/**
 * Modal de 2FA de la cuenta con sesión, A PANTALLA COMPLETA (abarca toda
 * la vista) con dos pasos, según la petición de RIBANI:
 *
 *   PASO 1 — Generar el código QR (el familiar/admin escanea con su app
 *            authenticator).
 *   PASO 2 — Introducir el código de 6 dígitos y verificar
 *            (POST /auth/2fa/verify activa two_factor_enabled).
 *
 * No toca el flujo asistido de adultos mayores ( familia/dos-pasos-adulto-modal).
 */
export function DosPasosModal({ abierto, onCerrar }: DosPasosModalProps) {
  return abierto ? <ContenidoDosPasos onCerrar={onCerrar} /> : null
}

function ContenidoDosPasos({ onCerrar }: Pick<DosPasosModalProps, 'onCerrar'>) {
  const usuario = useAuthStore((state) => state.usuario)
  const setup = useSetupDosPasos()
  const confirmar = useConfirmarDosPasos()

  const [paso, setPaso] = useState<'qr' | 'codigo'>('qr')
  const [codigoQr, setCodigoQr] = useState<string | null>(null)
  const [errorQr, setErrorQr] = useState<string | null>(null)
  const [codigo, setCodigo] = useState('')

  async function generarQr(): Promise<void> {
    setErrorQr(null)
    setCodigoQr(null)

    try {
      const respuesta = await setup.refetch()
      const otpauthUrl = respuesta.data?.otpauthUrl

      if (!otpauthUrl) {
        setErrorQr('No se pudo generar el código 2FA. Intenta de nuevo.')
        return
      }

      setCodigoQr(await QRCode.toDataURL(otpauthUrl, { margin: 2, width: 280 }))
    } catch {
      setErrorQr('No se pudo generar el código 2FA. Intenta de nuevo.')
    }
  }

  function verificar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    confirmar.mutate(codigo.trim().replace(/\s/g, ''), {
      onSuccess: () => onCerrar(),
    })
  }

  return (
    // Ventana que abarca TODA la vista (fixed inset-0, fondo opaco).
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-pino-900"
    >
      <div className="w-full max-w-lg px-6 py-10">
        <header className="flex items-center gap-2.5 text-white">
          <EscudoRibani className="h-7 w-7 shrink-0" />
          <div>
            <h1 className="font-display text-xl font-semibold">
              Verificación en dos pasos
            </h1>
            <p className="text-xs text-pino-200">
              Cuenta de {usuario?.email}
            </p>
          </div>
        </header>

        <div className="mt-6 rounded-lg bg-white p-6 shadow-xl">
          {/* PASO 1: generar el código QR a pantalla completa. */}
          {paso === 'qr' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-lg font-semibold text-pino-900">
                  Paso 1 · Genera el código QR
                </h2>
                <p className="mt-1 text-sm/6 text-salvia-700">
                  Escanea el QR con tu app authenticator (Google Authenticator,
                  Authy, etc.). Luego pasas al paso 2 para verificar.
                </p>
              </div>

              <div className="flex flex-col items-center gap-3">
                <Button
                  type="button"
                  onClick={() => void generarQr()}
                  disabled={setup.isFetching}
                >
                  {setup.isFetching ? (
                    <Spinner size="sm" label="Generando QR…" />
                  ) : codigoQr ? (
                    'Generar otro QR'
                  ) : (
                    'Generar código QR'
                  )}
                </Button>

                {codigoQr && (
                  <>
                    <img
                      src={codigoQr}
                      alt={`Código QR de 2FA para ${usuario?.email}`}
                      className="rounded-md bg-white p-2 ring-1 ring-salvia-200"
                      width={280}
                      height={280}
                    />
                    <p className="text-xs text-salvia-600">
                      ¿Ya lo escaneaste? Continúa al paso 2.
                    </p>
                    <Button onClick={() => setPaso('codigo')}>
                      Continuar
                    </Button>
                  </>
                )}

                {errorQr && <Alert variant="error">{errorQr}</Alert>}
              </div>
            </div>
          )}

          {/* PASO 2: introducir el código de 6 dígitos y verificar. */}
          {paso === 'codigo' && (
            <form className="space-y-5" onSubmit={verificar}>
              <div>
                <h2 className="font-display text-lg font-semibold text-pino-900">
                  Paso 2 · Ingresa y verifica tu código
                </h2>
                <p className="mt-1 text-sm/6 text-salvia-700">
                  Escribe el código de 6 dígitos que muestra tu app
                  authenticator (cambia cada 30 segundos).
                </p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="dos-pasos-modal-codigo"
                  className="block text-sm font-medium text-pino-900"
                >
                  Código de la app authenticator
                </label>
                <Input
                  id="dos-pasos-modal-codigo"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  maxLength={8}
                  required
                  className="text-center text-lg tracking-[0.4em]"
                  value={codigo}
                  onChange={(evento) =>
                    setCodigo(evento.target.value.replace(/[^\d]/g, ''))
                  }
                />
              </div>

              {confirmar.isError && (
                <Alert variant="error">
                  El código no coincide. Verifica que tu app esté sincronizada
                  y vuelve a intentarlo.
                </Alert>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setCodigo('')
                    setPaso('qr')
                  }}
                >
                  Volver
                </Button>
                <Button type="submit" disabled={confirmar.isPending}>
                  {confirmar.isPending ? (
                    <Spinner size="sm" label="Verificando…" />
                  ) : (
                    'Verificar y activar'
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        <button
          type="button"
          className="mt-4 w-full rounded-md py-2 text-sm font-medium text-pino-200 hover:bg-pino-800 hover:text-white"
          onClick={onCerrar}
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}
