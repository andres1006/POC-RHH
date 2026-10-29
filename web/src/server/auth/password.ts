// Hash de contraseñas con scrypt de Node (sin dependencias). Formato: scrypt$<salt hex>$<hash hex>
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto'

export function hashPassword(password: string) {
  const salt = randomBytes(16)
  return `scrypt$${salt.toString('hex')}$${scryptSync(password, salt, 64).toString('hex')}`
}

export function verifyPassword(password: string, stored: string) {
  const [, salt, hash] = stored.split('$')
  if (!salt || !hash) return false
  const expected = Buffer.from(hash, 'hex')
  const actual = scryptSync(password, Buffer.from(salt, 'hex'), expected.length)
  return timingSafeEqual(actual, expected)
}

/** Token de sesión opaco; en la base solo se guarda su hash (si se filtra la tabla, no sirve para entrar). */
export const newToken = () => randomBytes(32).toString('base64url')
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')
