import 'server-only'
import { and, eq, gt } from 'drizzle-orm'
import { cache } from 'react'
import { z } from 'zod'
import { db, withTenant } from '../db/client'
import { employees, sessions, tenants, users } from '../db/schema'
import { AppError, type SessionUser, type Tenant } from '../context'
import { hashPassword, hashToken, newToken, verifyPassword } from './password'
import { today } from '@/platform/format'

const SESSION_DAYS = 30

/** Tenants no tiene RLS: es el directorio público de empresas (slug → id). */
export const findTenant = cache(async (slug: string): Promise<Tenant | undefined> => {
  const [t] = await db.select().from(tenants).where(eq(tenants.slug, slug))
  return t
})

export const listTenants = () => db.select({ slug: tenants.slug, name: tenants.name, primaryColor: tenants.primaryColor, tagline: tenants.tagline }).from(tenants).orderBy(tenants.createdAt)

export async function resolveSession(tenant: Tenant, token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null
  return withTenant(tenant.id, async (tx) => {
    const [row] = await tx
      .select({ userId: users.id, employeeId: employees.id, role: employees.role, firstName: employees.firstName, lastName: employees.lastName, position: employees.position, mustChangePassword: users.mustChangePassword })
      .from(sessions).innerJoin(users, eq(users.id, sessions.userId)).innerJoin(employees, eq(employees.id, users.employeeId))
      .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())))
    return row ?? null
  })
}

const Credentials = z.object({ email: z.string().trim().toLowerCase().email('Correo inválido'), password: z.string().min(1, 'Escribe tu contraseña') })

export async function login(tenant: Tenant, input: unknown) {
  const { email, password } = Credentials.parse(input)
  return withTenant(tenant.id, async (tx) => {
    const [u] = await tx.select().from(users).where(eq(users.email, email))
    // Mismo mensaje si el correo no existe o la clave falla: no revela qué cuentas existen.
    if (!u || !verifyPassword(password, u.passwordHash)) throw new AppError(401, 'Correo o contraseña incorrectos')
    const token = newToken()
    await tx.insert(sessions).values({ tokenHash: hashToken(token), tenantId: tenant.id, userId: u.id, expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000) })
    return { token, maxAge: SESSION_DAYS * 86_400 }
  })
}

export async function logout(tenant: Tenant, token: string | undefined) {
  if (!token) return
  await withTenant(tenant.id, (tx) => tx.delete(sessions).where(eq(sessions.tokenHash, hashToken(token))))
}

const Password = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(100)

export async function changePassword(tenant: Tenant, user: SessionUser, input: unknown) {
  const { current, next } = z.object({ current: z.string(), next: Password }).parse(input)
  await withTenant(tenant.id, async (tx) => {
    const [u] = await tx.select().from(users).where(eq(users.id, user.userId))
    if (!u || !verifyPassword(current, u.passwordHash)) throw new AppError(400, 'La contraseña actual no es correcta')
    await tx.update(users).set({ passwordHash: hashPassword(next), mustChangePassword: false }).where(eq(users.id, user.userId))
  })
}

const RESERVED = ['api', 'registro', 'login', 'www', 'admin', '_next', 'tenants']

export const RegisterTenant = z.object({
  companyName: z.string().trim().min(2, 'Nombre de empresa muy corto').max(60),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/, 'Usa 3-32 letras minúsculas, números o guiones').refine((s) => !RESERVED.includes(s), 'Ese identificador está reservado'),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#0071E3'),
  firstName: z.string().trim().min(2), lastName: z.string().trim().min(2),
  position: z.string().trim().min(2).default('Administrador'),
  email: z.string().trim().toLowerCase().email('Correo inválido'),
  password: Password,
})

/** Crea una empresa nueva con su primer administrador (que también es empleado). */
export async function registerTenant(input: unknown) {
  const data = RegisterTenant.parse(input)
  if (await findTenant(data.slug)) throw new AppError(409, 'Ese identificador ya está en uso')
  const [t] = await db.insert(tenants).values({ slug: data.slug, name: data.companyName, primaryColor: data.primaryColor }).returning()
  await withTenant(t.id, async (tx) => {
    const [e] = await tx.insert(employees).values({
      tenantId: t.id, firstName: data.firstName, lastName: data.lastName, position: data.position, department: 'Dirección',
      role: 'admin', email: data.email, hireDate: today(),
    }).returning()
    await tx.insert(users).values({ tenantId: t.id, employeeId: e.id, email: data.email, passwordHash: hashPassword(data.password) })
  })
  return { slug: t.slug }
}

/** Da acceso (cuenta) a un empleado existente. Devuelve la contraseña temporal una sola vez. */
export async function createAccount(tenantId: string, employeeId: string, email: string) {
  const temp = `Temp-${newToken().slice(0, 8)}`
  await withTenant(tenantId, async (tx) => {
    const [exists] = await tx.select({ id: users.id }).from(users).where(eq(users.employeeId, employeeId))
    if (exists) throw new AppError(409, 'Esta persona ya tiene acceso')
    await tx.insert(users).values({ tenantId, employeeId, email, passwordHash: hashPassword(temp), mustChangePassword: true })
  })
  return temp
}
