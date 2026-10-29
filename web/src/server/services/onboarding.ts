import 'server-only'
import { asc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { withTenant } from '../db/client'
import { employeeEvents, employees, onboardingTasks, onboardings, reviews } from '../db/schema'
import { AppError, assertCan, type Ctx } from '../context'
import { can } from '@/platform/rbac'
import { today } from '@/platform/format'
import { addDays, ONBOARDING_TEMPLATE } from '../db/demo-data'

export type OnboardingView = typeof onboardings.$inferSelect & { employee: typeof employees.$inferSelect; tasks: (typeof onboardingTasks.$inferSelect)[] }

/** Onboardings visibles: el propio, los del equipo (líder) o todos (RR. HH.). */
export function listOnboardings(ctx: Ctx) {
  return withTenant(ctx.tenant.id, async (tx): Promise<OnboardingView[]> => {
    const rows = await tx.select({ o: onboardings, e: employees }).from(onboardings).innerJoin(employees, eq(employees.id, onboardings.employeeId)).orderBy(asc(onboardings.startDate))
    const visible = rows.filter(({ e }) => can(ctx.user.role, 'people.read_all') || e.id === ctx.user.employeeId || e.managerId === ctx.user.employeeId)
    if (!visible.length) return []
    const tasks = await tx.select().from(onboardingTasks).where(inArray(onboardingTasks.onboardingId, visible.map((v) => v.o.id))).orderBy(asc(onboardingTasks.position))
    return visible.map(({ o, e }) => ({ ...o, employee: e, tasks: tasks.filter((t) => t.onboardingId === o.id) }))
  })
}

export function toggleTask(ctx: Ctx, taskId: string) {
  return withTenant(ctx.tenant.id, async (tx) => {
    const [row] = await tx.select({ t: onboardingTasks, e: employees }).from(onboardingTasks)
      .innerJoin(onboardings, eq(onboardings.id, onboardingTasks.onboardingId)).innerJoin(employees, eq(employees.id, onboardings.employeeId))
      .where(eq(onboardingTasks.id, taskId))
    if (!row) throw new AppError(404, 'Tarea no encontrada')
    const allowed = row.e.id === ctx.user.employeeId || row.e.managerId === ctx.user.employeeId || can(ctx.user.role, 'people.read_all')
    if (!allowed) throw new AppError(403, 'No puedes modificar esta tarea')
    const doneAt = row.t.doneAt ? null : today()
    await tx.update(onboardingTasks).set({ doneAt }).where(eq(onboardingTasks.id, taskId))
  })
}

export const HireInput = z.object({
  firstName: z.string().trim().min(2, 'Nombres muy cortos'), lastName: z.string().trim().min(2, 'Apellidos muy cortos'),
  position: z.string().trim().min(2, 'Escribe el cargo'), managerId: z.string().uuid('Elige un líder'),
  email: z.string().trim().toLowerCase().email('Correo inválido'), startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

/** Registra un ingreso: crea la persona, su evento de historia, su evaluación inicial y su ruta de onboarding. */
export function hireEmployee(ctx: Ctx, input: unknown) {
  assertCan(ctx, 'people.read_all')
  const data = HireInput.parse(input)
  return withTenant(ctx.tenant.id, async (tx) => {
    const [manager] = await tx.select().from(employees).where(eq(employees.id, data.managerId))
    if (!manager) throw new AppError(400, 'Líder no válido')
    const [dup] = await tx.select({ id: employees.id }).from(employees).where(eq(employees.email, data.email))
    if (dup) throw new AppError(409, 'Ya existe una persona con ese correo')
    const [e] = await tx.insert(employees).values({
      tenantId: ctx.tenant.id, firstName: data.firstName, lastName: data.lastName, position: data.position, department: manager.department,
      managerId: manager.id, email: data.email, hireDate: data.startDate, eps: 'Por afiliar', pension: 'Por afiliar',
    }).returning()
    await tx.insert(employeeEvents).values({ tenantId: ctx.tenant.id, employeeId: e.id, date: data.startDate, kind: 'Ingreso', changes: [['Cargo', '—', data.position], ['Área', '—', manager.department]] })
    await tx.insert(reviews).values({ tenantId: ctx.tenant.id, employeeId: e.id, performance: 2, potential: 2 })
    const [o] = await tx.insert(onboardings).values({ tenantId: ctx.tenant.id, employeeId: e.id, startDate: data.startDate }).returning()
    await tx.insert(onboardingTasks).values(ONBOARDING_TEMPLATE.map((t, i) => ({ tenantId: ctx.tenant.id, onboardingId: o.id, position: i, title: t.title, owner: t.owner, due: addDays(data.startDate, i * 2) })))
    return e
  })
}
