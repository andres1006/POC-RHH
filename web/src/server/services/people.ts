import 'server-only'
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { withTenant } from '../db/client'
import { employeeEvents, employees, users } from '../db/schema'
import { AppError, type Ctx } from '../context'
import { can } from '@/platform/rbac'

export type Employee = typeof employees.$inferSelect

export function listEmployees(ctx: Ctx, opts: { q?: string; area?: string } = {}) {
  return withTenant(ctx.tenant.id, (tx) => {
    const q = opts.q?.trim()
    return tx.select().from(employees).where(and(
      opts.area ? eq(employees.department, opts.area) : undefined,
      q ? or(ilike(sql`unaccent_es(${employees.firstName} || ' ' || ${employees.lastName} || ' ' || ${employees.position})`, sql`'%' || unaccent_es(${q}) || '%'`)) : undefined,
    )).orderBy(asc(employees.firstName))
  })
}

export const listAreas = (ctx: Ctx) =>
  withTenant(ctx.tenant.id, async (tx) => (await tx.selectDistinct({ d: employees.department }).from(employees).orderBy(employees.department)).map((r) => r.d))

/** Ficha de una persona. Los datos sensibles se limpian si quien consulta no tiene permiso. */
export async function getEmployee(ctx: Ctx, id: string) {
  return withTenant(ctx.tenant.id, async (tx) => {
    const [e] = await tx.select().from(employees).where(eq(employees.id, id))
    if (!e) throw new AppError(404, 'Persona no encontrada')
    const [manager] = e.managerId ? await tx.select().from(employees).where(eq(employees.id, e.managerId)) : []
    const events = await tx.select().from(employeeEvents).where(eq(employeeEvents.employeeId, id)).orderBy(desc(employeeEvents.date))
    const [account] = await tx.select({ id: users.id }).from(users).where(eq(users.employeeId, id))
    const sensitive = id === ctx.user.employeeId || can(ctx.user.role, 'people.read_sensitive')
    const safe = sensitive ? e : { ...e, salary: 0, documentId: '', eps: '', pension: '', phone: '' }
    return { employee: safe, manager, events, sensitive, hasAccount: !!account }
  })
}

export const getMe = (ctx: Ctx) => getEmployee(ctx, ctx.user.employeeId)
