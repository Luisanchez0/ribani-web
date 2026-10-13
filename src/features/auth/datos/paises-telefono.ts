/**
 * Países para el selector de código telefónico del registro.
 * Lista corta y ordenada por nombre; se amplía según necesidad real
 * de los usuarios (Latinoamérica primero).
 */
export type PaisTelefono = {
  nombre: string
  codigo: string
  bandera: string
}

export const PAISES_TELEFONO: PaisTelefono[] = [
  { nombre: 'Argentina', codigo: '+54', bandera: '🇦🇷' },
  { nombre: 'Bolivia', codigo: '+591', bandera: '🇧🇴' },
  { nombre: 'Chile', codigo: '+56', bandera: '🇨🇱' },
  { nombre: 'Colombia', codigo: '+57', bandera: '🇨🇴' },
  { nombre: 'Costa Rica', codigo: '+506', bandera: '🇨🇷' },
  { nombre: 'Cuba', codigo: '+53', bandera: '🇨🇺' },
  { nombre: 'Ecuador', codigo: '+593', bandera: '🇪🇨' },
  { nombre: 'El Salvador', codigo: '+503', bandera: '🇸🇻' },
  { nombre: 'España', codigo: '+34', bandera: '🇪🇸' },
  { nombre: 'Estados Unidos', codigo: '+1', bandera: '🇺🇸' },
  { nombre: 'Guatemala', codigo: '+502', bandera: '🇬🇹' },
  { nombre: 'Honduras', codigo: '+504', bandera: '🇭🇳' },
  { nombre: 'México', codigo: '+52', bandera: '🇲🇽' },
  { nombre: 'Nicaragua', codigo: '+505', bandera: '🇳🇮' },
  { nombre: 'Panamá', codigo: '+507', bandera: '🇵🇦' },
  { nombre: 'Paraguay', codigo: '+595', bandera: '🇵🇾' },
  { nombre: 'Perú', codigo: '+51', bandera: '🇵🇪' },
  { nombre: 'Puerto Rico', codigo: '+1787', bandera: '🇵🇷' },
  { nombre: 'República Dominicana', codigo: '+1809', bandera: '🇩🇴' },
  { nombre: 'Uruguay', codigo: '+598', bandera: '🇺🇾' },
  { nombre: 'Venezuela', codigo: '+58', bandera: '🇻🇪' },
]
