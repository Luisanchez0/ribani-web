import { useState } from 'react'
import type { FormEvent } from 'react'
import QRCode from 'qrcode'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import {
  useConfirmarDosPasos,
  useSetupDosPasos,
} from '../hooks'
import type { AdultoVinculado } from '../types'

type DosPasosAdultoModalProps = {
  abierto: boolean
  /** Adulto mayor al que se le activa el 2FA asistido. */
  adulto: AdultoVinculado
  onCerrar: () => void
}

/**
 * Modal de 2FA asistido del adulto mayor, conducido por el familiar
 * encargado (endpoints /usuarios/{id}/2fa/setup y /2fa/verify con el
 * permiso usuarios.administrar_2fa, que validan el vínculo ACTIVA).
 *
 * Flujo:
 *  1. Generar QR → el backend crea un secreto TOTP nuevo para el adulto
 *     (opcionalmente repetible si no se confirmó).
 *  2. El adulto escanea el QR con su app authenticator.
 *  3. El adulto dice el código de 6 dígitos y el familiar lo ingresa;
 *     el verify valida el TOTP y activa two_factor_enabled.
 */
export function DosPasosAdultoModal({
  abierto,
  adulto,
  onCerrar,
}: DosPasosAdultoModalProps) {
  const setup = useSetupDosPasos(adulto.id)
  const confirmar = useConfirmarDosPasos(adulto.id)

  const [codigoQr, setCodigoQr] = useState<string | null>(null)
  const [errorQr, setErrorQr] = useState<string | null>(null)
  const [codigo, setCodigo] = useState('')
  const [exito, setExito] = useState(false)

  if (!abierto) return null

  async function generarQr() {
    setErrorQr(null)
    setCodigoQr(null)
    setExito(false)

    try {
      const respuesta = await setup.refetch()
      const otpauthUrl = respuesta.data?.otpauthUrl

      if (!otpauthUrl) {
        setErrorQr('No se pudo generar el código 2FA. Intenta de nuevo.')
        return
      }

      setCodigoQr(await QRCode.toDataURL(otpauthUrl, { margin: 2, width: 220 }))
    } catch {
      setErrorQr('No se pudo generar el código 2FA. Intenta de nuevo.')
    }
  }

  function confirmarCodigo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    setExito(false)
    confirmar.mutate(codigo.trim().replace(/\s/g, ''), {
      onSuccess: () => setExito(true),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar configuración 2FA"
        className="absolute inset-0 cursor-default bg-pino-950/60"
        onClick={onCerrar}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-dos-pasos-modal"
        className="relative w-full max-w-md rounded-lg border border-salvia-200 bg-white p-6 shadow-lg"
      >
        <h2
          id="titulo-dos-pasos-modal"
          className="font-display text-lg font-semibold text-pino-900"
        >
          Verificación en dos pasos
        </h2>
        <p className="mt-1 text-sm/6 text-salvia-700">
          Cuenta de <strong>{adulto.nombre} {adulto.apellido}</strong>. Con esto
          tu adulto mayor necesitará un código extra de su app authenticator
          cada vez que inicie sesión.
        </p>

        <form className="mt-5 space-y-4" onSubmit={confirmarCodigo}>
          <div className="space-y-2">
            <Button
              type="button"
              variant="secondary"
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
            <p className="text-xs text-salvia-600">
              Muestra el QR al adulto para que lo escanee con su app
              authenticator (Google Authenticator, Authy, etc.).
            </p>
          </div>

          {codigoQr && (
            <div className="flex flex-col items-center gap-2 rounded-md border border-salvia-200 bg-salvia-50 p-4">
              <img
                src={codigoQr}
                alt={`Código QR de 2FA para ${adulto.nombre} ${adulto.apellido}`}
                className="rounded-md bg-white p-2"
                width={220}
                height={220}
              />
              <p className="text-xs text-salvia-600">
                Escaneándolo, la app configura la cuenta RIBANI del adulto.
              </p>
            </div>
          )}

          {errorQr && <Alert variant="error">{errorQr}</Alert>}

          <div className="space-y-1.5">
            <label
              htmlFor="dos-pasos-codigo"
              className="block text-sm font-medium text-pino-900"
            >
              Código de la app authenticator
            </label>
            <Input
              id="dos-pasos-codigo"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              maxLength={8}
              required
              value={codigo}
              onChange={(evento) =>
                setCodigo(evento.target.value.replace(/[^\d]/g, ''))
              }
            />
            <p className="text-xs text-salvia-600">
              Pídeselo al adulto mayor después de escanear el QR (6 dígitos que
              cambian cada 30 segundos).
            </p>
          </div>

          {confirmar.isError && (
            <Alert variant="error">
              El código no coincide. Verifica que la app del adulto esté
              sincronizada y vuelve a intentarlo.
            </Alert>
          )}

          {exito && (
            <Alert variant="success">
              ¡Listo! El 2FA quedó activado para {adulto.nombre}.
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={onCerrar}>
              Cerrar
            </Button>
            <Button
              type="submit"
              disabled={confirmar.isPending || !codigoQr || exito}
            >
              {confirmar.isPending ? (
                <Spinner size="sm" label="Confirmando…" />
              ) : (
                'Activar 2FA'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
