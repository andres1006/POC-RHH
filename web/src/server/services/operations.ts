import 'server-only'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { withTenant } from '../db/client'
import { attendanceMarks, employees, objectives, reviews } from '../db/schema'
import { AppError, assertCan, type Ctx } from '../context'
import { can } from '@/platform/rbac'
import { nowLocal } from '@/platform/format'

// ---------- Asistencia ----------

export const listMyMarks = (ctx: Ctx) =>
  withTenant(ctx.tenant.id, (tx) => tx.select().from(attendanceMarks).where(eq(attendanceMarks.employeeId, ctx.user.employeeId)).orderBy(desc(attendanceMarks.at)).limit(40))

/** Marca entrada o salida. El tipo lo decide el servidor según la última marca del día (evita dobles entradas). */
export function clock(ctx: Ctx) {
  return withTenant(ctx.tenant.id, async (tx) => {
    const at = nowLocal()
    const [last] = await tx.select().from(attendanceMarks).where(eq(attendanceMarks.employeeId, ctx.user.employeeId)).orderBy(desc(attendanceMarks.at)).limit(1)
    const kind = last?.kind === 'in' && last.at.slice(0, 10) === at.slice(0, 10) ? 'out' : 'in'
    const [m] = await tx.insert(attendanceMarks).values({ tenantId: ctx.tenant.id, employeeId: ctx.user.employeeId, kind, at }).returning()
    return m
  })
}

/** Equipo para turnos: RR. HH. ve Operaciones (personal por turnos); el líder, su equipo. */
export function teamAttendance(ctx: Ctx) {
  assertCan(ctx, 'requests.approve')
  return withTenant(ctx.tenant.id, async (tx) => {
    const team = can(ctx.user.role, 'people.read_all')
      ? await tx.select().from(employees).where(eq(employees.department, 'Operaciones'))
      : await tx.select().from(employees).where(eq(employees.managerId, ctx.user.employeeId))
    const marks = team.length ? await tx.select().from(attendanceMarks).where(inArray(attendanceMarks.employeeId, team.map((t) => t.id))) : []
    return { team, marks }
  })
}

// ---------- Desempeño ----------

export function nineBox(ctx: Ctx) {
  return withTenant(ctx.tenant.id, async (tx) => {
    const isHr = can(ctx.user.role, 'people.read_all')
    const people = await tx.select({ e: employees, r: reviews }).from(employees).leftJoin(reviews, eq(reviews.employeeId, employees.id))
    const scope = people.filter(({ e }) => e.id !== ctx.user.employeeId && (isHr || e.managerId === ctx.user.employeeId))
    const mine = people.find(({ e }) => e.id === ctx.user.employeeId)?.r ?? null
    const myObjectives = await tx.select().from(objectives).where(eq(objectives.employeeId, ctx.user.employeeId))
    return { scope, mine, myObjectives, isHr }
  })
}

export const MoveInput = z.object({ employee: z.string().uuid(), performance: z.coerce.number().int().min(1).max(3), potential: z.coerce.number().int().min(1).max(3) })

export function moveInBox(ctx: Ctx, input: unknown) {
  assertCan(ctx, 'requests.approve')
  const { employee, performance, potential } = MoveInput.parse(input)
  return withTenant(ctx.tenant.id, async (tx) => {
    const [target] = await tx.select().from(employees).where(eq(employees.id, employee))
    // Un líder solo calibra a su equipo; RR. HH. a todos
    if (!target || (target.managerId !== ctx.user.employeeId && !can(ctx.user.role, 'people.read_all'))) throw new AppError(403, 'Sin permiso sobre esta persona')
    await tx.insert(reviews).values({ tenantId: ctx.tenant.id, employeeId: employee, performance, potential })
      .onConflictDoUpdate({ target: reviews.employeeId, set: { performance, potential } })
  })
}

export const ObjectiveInput = z.object({ progress: z.coerce.number().int().min(0).max(100) })

export function updateObjective(ctx: Ctx, id: string, input: unknown) {
  const { progress } = ObjectiveInput.parse(input)
  return withTenant(ctx.tenant.id, async (tx) => {
    const res = await tx.update(objectives).set({ progress }).where(and(eq(objectives.id, id), eq(objectives.employeeId, ctx.user.employeeId))).returning()
    if (!res.length) throw new AppError(404, 'Objetivo no encontrado')
  })
}
