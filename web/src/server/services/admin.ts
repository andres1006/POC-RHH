import 'server-only'
import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, withTenant } from '../db/client'
import { employees, tenants, users } from '../db/schema'
import { AppError, assertCan, type Ctx } from '../context'
import { createAccount } from '../auth/service'

export const BrandInput = z.object({ name: z.string().trim().min(2).max(60), color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color inválido') })

export async function updateBrand(ctx: Ctx, input: unknown) {
  assertCan(ctx, 'tenant.configure')
  const { name, color } = BrandInput.parse(input)
  await db.update(tenants).set({ name, primaryColor: color }).where(eq(tenants.id, ctx.tenant.id))
}

/** Personas con su rol y si tienen cuenta para entrar. */
export function listAccess(ctx: Ctx) {
  assertCan(ctx, 'people.read_all')
  return withTenant(ctx.tenant.id, (tx) =>
    tx.select({ e: employees, userId: users.id, mustChange: users.mustChangePassword })
      .from(employees).leftJoin(users, eq(users.employeeId, employees.id)).orderBy(asc(employees.firstName)))
}

export const RoleInput = z.object({ role: z.enum(['employee', 'leader', 'hr', 'admin']) })

export function changeRole(ctx: Ctx, employeeId: string, input: unknown) {
  assertCan(ctx, 'tenant.configure')
  const { role } = RoleInput.parse(input)
  if (employeeId === ctx.user.employeeId && role !== 'admin') throw new AppError(400, 'No puedes quitarte el rol de administrador a ti mismo')
  return withTenant(ctx.tenant.id, async (tx) => {
    const res = await tx.update(employees).set({ role }).where(eq(employees.id, employeeId)).returning()
    if (!res.length) throw new AppError(404, 'Persona no encontrada')
  })
}

/** Da acceso a la plataforma: crea la cuenta con contraseña temporal que debe cambiar al entrar. */
export async function grantAccess(ctx: Ctx, employeeId: string) {
  assertCan(ctx, 'people.read_all')
  const [e] = await withTenant(ctx.tenant.id, (tx) => tx.select().from(employees).where(eq(employees.id, employeeId)))
  if (!e) throw new AppError(404, 'Persona no encontrada')
  const password = await createAccount(ctx.tenant.id, e.id, e.email)
  return { email: e.email, password }
}

export function revokeAccess(ctx: Ctx, employeeId: string) {
  assertCan(ctx, 'tenant.configure')
  if (employeeId === ctx.user.employeeId) throw new AppError(400, 'No puedes quitarte el acceso a ti mismo')
  return withTenant(ctx.tenant.id, (tx) => tx.delete(users).where(eq(users.employeeId, employeeId)))
}
